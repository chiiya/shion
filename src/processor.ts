import { Output, Input, OptimizeOptions, Result } from '../types/types'
import { basename, join, extname } from 'path'
import { buffer as imageminBuffer } from 'imagemin'
import { formatSize, getFileInformation } from './helpers'
const { readFile, writeFile, copyFile } = require('fs-extra')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminWebp = require('imagemin-webp')
const imageminGifsicle = require('imagemin-gifsicle')

export default class Processor {
  /**
   * Get the output path and filename information.
   * @param input
   * @param basedir
   */
  public static getOutputData(input: Input, basedir: string): Output {
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
  public static async optimizeImage(
    input: Input,
    output: Output,
    options: OptimizeOptions
  ): Promise<Result[]> {
    // Create optimized buffer
    const extension = extname(output.filename)
      .substr(1)
      .toUpperCase()
    const buffer = await readFile(input.fullPath)
    const originalSize = buffer.length
    const optimizedBuffer = await imageminBuffer(buffer, {
      plugins: [
        imageminMozjpeg(options.mozJpeg),
        imageminPngquant(options.pngQuant),
        imageminSvgo(options.svgo),
        imageminGifsicle(options.gifSicle)
      ]
    })

    // If new size is larger than origin, simply copy the original
    const newSize = optimizedBuffer.length
    if (originalSize < newSize) {
      return await this.copyImage(input, output)
    }
    await writeFile(output.fullPath, buffer)
    const results: Result[] = [
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

  /**
   * Copy an image from one location to another.
   * @param input
   * @param output
   */
  public static async copyImage(input: Input, output: Output): Promise<Result[]> {
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
}
