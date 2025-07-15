import type {
  Output,
  Input,
  ResizeResult,
  ResolvedResizeOptions,
} from '../types/types'
import { basename, join, extname } from 'path'
import { getNumberInputAsArray, isAbsolutePath } from './helpers'
import { createReadStream, createWriteStream } from 'fs-extra'
const sharp = require('sharp')

export default class Processor {
  /**
   * Get the output path and filename information.
   * @param input
   * @param basedir
   */
  public getOutputData(input: Input, basedir: string): Output {
    const filename = basename(input.fullPath)
    const dir = join(basedir, input.fullPath.replace(input.basedir, '').replace(filename, ''))
    return {
      fullPath: isAbsolutePath(dir) ? join(dir, filename) : join(process.cwd(), dir, filename),
      basedir,
      dir: isAbsolutePath(dir) ? dir : join(process.cwd(), dir),
      filename,
    }
  }

  public async optimizeAndResize(
    input: Input,
    output: Output,
    options: ResolvedResizeOptions
  ): Promise<ResizeResult[]> {
    const results: ResizeResult[] = []

    const extension = extname(output.filename).substring(1).toUpperCase()
    const sizes = getNumberInputAsArray(options.sizes)

    for (const size of sizes) {
      const resizer = sharp().resize(size)
      if (options.optimize) {
        resizer.jpeg(options.jpg).png(options.png).webp(options.webp)
      }

      const filename = output.filename.replace(/\.[^/.]+$/, '')
      const outputName = this.getResizedFilename(
        filename,
        extension.toLowerCase(),
        size,
        options.pattern
      )
      const path = join(output.dir, outputName)
      await this.resizeImage(input.fullPath, path, resizer)
      results.push({
        path: join(output.dir, outputName),
        type: extension,
        size,
      })
    }

    return results
  }

  protected async resizeImage(input: string, output: string, resizer: any): Promise<void> {
    return new Promise<void>((resolve) => {
      const stream = createReadStream(input)
      stream.pipe(resizer).pipe(createWriteStream(output).on('finish', resolve))
    })
  }

  protected getResizedFilename(
    filename: string,
    extension: string,
    size: number,
    pattern: string
  ): string {
    return pattern
      .replace('[name]', filename)
      .replace('[extension]', extension)
      .replace('[size]', size.toString())
  }
}
