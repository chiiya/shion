import Logger from './logger'
import { Options } from './types'
import { getDirectoriesRecursive } from './helpers'
import { basename, dirname, extname, join } from 'path'
import { Result } from 'imagemin'
const { rename } = require('fs-extra')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminWebp = require('imagemin-webp')
const imageminGifsicle = require('imagemin-gifsicle')

export default class Chordbox {
  protected logger: Logger

  constructor() {
    this.logger = new Logger()
  }

  /**
   * Optimize all images from a given input folder (or multiple input folders)
   * and copy them to a given output folder. Can also create webp versions of jpg
   * and png images by specifying the `webp: true` flag in the options parameter.
   *
   * @param {string|string[]} input
   * @param {string} output
   * @param {object} options
   * @param {boolean} options.webp
   */
  public async images(input: string[] | string, output: string, options?: Options) {
    const configuration = this.getConfiguration(options)
    let directories: string[] = []
    let images: string[] = []

    this.logger.spin('Optimizing images...')

    if (Array.isArray(input)) {
      input = [...input]
    } else {
      input = [input]
    }

    input.map((dirname: string) => {
      directories = [...directories, ...getDirectoriesRecursive(dirname)]
    })

    for (const directory of directories) {
      const files = await this.optimizeImages(directory, output)
      images = [...images, ...files.map((file: Result) => file.path)]
    }

    if (configuration.webp === true) {
      for (const directory of directories) {
        // await this.createWebpFiles(directory, output);
      }
    }

    this.logger.succeed(`${images.length} files copied.`)
  }

  /**
   * Optimize images from a given input directory, and copy them to a given output directory.
   *
   * @param {string} directory directory
   * @param {string} output directory
   *
   * @returns array of copied filenames
   */
  protected async optimizeImages(directory: string, output: string): Promise<Result[]> {
    return imagemin([`${directory}/*.{jpg,jpeg,png,svg,gif}`], join(output, directory), {
      plugins: [
        imageminMozjpeg({ quality: 90 }),
        imageminPngquant(),
        imageminSvgo({ removeViewBox: true }),
        imageminGifsicle({ optimizationLevel: 3 })
      ]
    })
  }

  /**
   * Create webp files from a given input directory, and copy them to a given output directory.
   *
   * @param directory
   * @param output
   */
  protected async createWebpFiles(directory: string, output: string): Promise<void> {
    for (const extension of ['jpg', 'png']) {
      const files = imagemin([`${directory}/*.${extension}`], join(output, directory), {
        plugins: [imageminWebp({ lossless: true })]
      })
      await this.renameWebpFiles(files.map((file: Result) => file.path), extension)
    }
  }

  /**
   * Rename webp files for better compatibility with nginx:
   * `cat.webp` -> `cat.jpg.webp`
   *
   * @param files
   * @param extension
   */
  protected async renameWebpFiles(files: string[], extension: string): Promise<void> {
    for (const file of files) {
      const name = basename(file, extname(file))
      const dir = dirname(file)
      await rename(file, `${dir}/${name}${extension}.webp`)
    }
  }

  /**
   * Get the resolved configuration options.
   *
   * @param options
   */
  protected getConfiguration(options?: Options): Options {
    return Object.assign(
      {
        webp: false
      },
      options
    )
  }
}
