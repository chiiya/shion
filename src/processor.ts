import {
  Output,
  Input,
  OptimizeOptions,
  OptimizeResult,
  ResizeOptions,
  ResizeResult,
  ResolvedResizeOptions
} from '../types/types'
import { basename, join, extname } from 'path'
import { buffer as imageminBuffer } from 'imagemin'
import { formatSize, getFileInformation, getNumberInputAsArray } from './helpers'
import ReadableStream = NodeJS.ReadableStream
const { readFile, createReadStream, createWriteStream, writeFile, copyFile } = require('fs-extra')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminWebp = require('imagemin-webp')
const imageminGifsicle = require('imagemin-gifsicle')
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
      fullPath: join(process.cwd(), dir, filename),
      basedir,
      dir,
      filename
    }
  }

  /**
   * Optimize an image file using image-min. Also creates webp versions
   * if so configured.
   * @param input
   * @param output
   * @param options
   */
  public async optimizeImage(
    input: Input,
    output: Output,
    options: OptimizeOptions
  ): Promise<OptimizeResult[]> {
    let buffer: Buffer = await readFile(input.fullPath)
    // Create optimized buffer
    const extension = extname(output.filename)
      .substr(1)
      .toUpperCase()
    const originalSize = buffer.length
    const optimizedBuffer = await this.optimize(buffer, options)

    // If new size is larger than origin, simply copy the original
    const newSize = optimizedBuffer.length
    if (originalSize < newSize) {
      return this.copyImage(input, output)
    }
    await writeFile(output.fullPath, optimizedBuffer)
    const results: OptimizeResult[] = [
      {
        path: join(output.dir, output.filename),
        originalSize: formatSize(originalSize),
        newSize: formatSize(newSize),
        type: extension
      }
    ]

    // If webp images should be created, do it
    if (options.webp === true && ['JPG', 'JPEG', 'PNG'].includes(extension)) {
      const webpBuffer = await imageminBuffer(buffer, {
        plugins: [imageminWebp()]
      })
      await writeFile(`${output.fullPath}.webp`, webpBuffer)
      results.push({
        path: join(output.dir, `${output.filename}.webp`),
        originalSize: formatSize(originalSize),
        newSize: formatSize(webpBuffer.length),
        type: 'WEBP'
      })
    }

    return results
  }

  public async optimizeAndResize(
    input: Input,
    output: Output,
    options: ResolvedResizeOptions
  ): Promise<ResizeResult[]> {
    const results: ResizeResult[] = []

    const extension = extname(output.filename)
      .substr(1)
      .toUpperCase()
    const sizes = getNumberInputAsArray(options.sizes)

    for (const size of sizes) {
      const resizer = sharp().resize(size)
      if (options.optimize === true) {
        resizer
          .jpeg(options.jpg)
          .png(options.png)
          .webp(options.webp)
      }

      const filename = output.filename.replace(/\.[^/.]+$/, '')
      const outputName = this.getResizedFilename(
        filename,
        extension.toLowerCase(),
        size,
        options.pattern
      )
      const path = join(process.cwd(), output.dir, outputName)
      await this.resizeImage(input.fullPath, path, resizer)
      results.push({
        path: join(output.dir, outputName),
        type: extension,
        size
      })
    }

    return results
  }

  protected async resizeImage(input: string, output: string, resizer: any): Promise<void> {
    return new Promise<void>(resolve => {
      const stream: ReadableStream = createReadStream(input)
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

  /**
   * Copy an image from one location to another.
   * @param input
   * @param output
   */
  public async copyImage(input: Input, output: Output): Promise<OptimizeResult[]> {
    const information = getFileInformation(input.fullPath)
    await copyFile(input.fullPath, output.fullPath)
    return [
      {
        path: join(output.dir, output.filename),
        originalSize: information.size,
        newSize: information.size,
        type: information.type
      }
    ]
  }

  /**
   * Optimize an image with imagemin. Returns optimized buffer.
   * @param buffer
   * @param options
   */
  protected async optimize(buffer: Buffer, options: OptimizeOptions): Promise<Buffer> {
    return imageminBuffer(buffer, {
      plugins: [
        imageminMozjpeg(options.mozJpeg),
        imageminPngquant(options.pngQuant),
        imageminSvgo(options.svgo),
        imageminGifsicle(options.gifSicle)
      ]
    })
  }
}
