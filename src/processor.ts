import {
  Output,
  Input,
  OptimizeOptions,
  OptimizeResult,
  ResizeOptions,
  ResizeResult
} from '../types/types'
import { basename, join, extname } from 'path'
import { buffer as imageminBuffer } from 'imagemin'
import { formatSize, getFileInformation, getNumberInputAsArray } from './helpers'
const { readFile, writeFile, copyFile } = require('fs-extra')
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
    const buffer = await readFile(input.fullPath)
    // Create optimized buffer
    const extension = extname(output.filename)
      .substr(1)
      .toUpperCase()
    const originalSize = buffer.length
    const optimizedBuffer = await this.optimize(buffer, options)

    // If new size is larger than origin, simply copy the original
    const newSize = optimizedBuffer.length
    if (originalSize < newSize) {
      return await this.copyImage(input, output)
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
    options: ResizeOptions
  ): Promise<ResizeResult[]> {
    const results: ResizeResult[] = []
    let buffer = await readFile(input.fullPath)
    const extension = extname(output.filename)
      .substr(1)
      .toUpperCase()
    const originalSize = buffer.length

    if (options.optimize === true) {
      buffer = await this.optimize(buffer, options)
    }

    const newSize = buffer.length
    const sizes = getNumberInputAsArray(options.sizes)

    for (const size of sizes) {
      buffer = sharp(buffer)
        .resize({ width: size })
        .toBuffer()
      await writeFile(output.fullPath, buffer)
      results.push({
        path: join(output.dir, output.filename),
        originalSize: formatSize(originalSize),
        newSize: formatSize(newSize),
        type: extension,
        size
      })

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
          type: 'WEBP',
          size
        })
      }
    }

    return results
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
    return await imageminBuffer(buffer, {
      plugins: [
        imageminMozjpeg(options.mozJpeg),
        imageminPngquant(options.pngQuant),
        imageminSvgo(options.svgo),
        imageminGifsicle(options.gifSicle)
      ]
    })
  }
}
