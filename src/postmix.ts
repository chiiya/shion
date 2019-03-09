import Logger from './logger'
import { Options, Directory } from '../types/types'
import { getDirectoriesRecursive, getFileInformation } from './helpers'
import { basename, dirname, extname, join } from 'path'
import { Result } from 'imagemin'
import Table from 'cli-table'
import chalk from 'chalk'
const { rename } = require('fs-extra')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminWebp = require('imagemin-webp')
const imageminGifsicle = require('imagemin-gifsicle')

export default class Postmix {
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
    this.logger.log('Executing image task.')
    this.logger.spin('Optimizing images...')
    const start: number = new Date().getTime()

    const configuration = this.getConfiguration(options)
    let directories: Directory[] = []
    let images: string[] = []

    if (Array.isArray(input)) {
      input = [...input]
    } else {
      input = [input]
    }

    input.map((dirname: string) => {
      const subdirs = getDirectoriesRecursive(dirname)
      for (const dir of subdirs) {
        directories.push({ basePath: dirname, path: dir })
      }
    })

    for (const directory of directories) {
      const files = await this.copyImages(directory, output)
      images = [...images, ...files.map((file: Result) => file.path)]
    }

    if (configuration.webp === true) {
      for (const directory of directories) {
        const files = await this.createWebpFiles(directory, output)
        images = [...images, ...files]
      }
    }

    this.logger.stop()
    this.printResults(images)
    const time = new Date().getTime() - start
    this.logger.log(`Image task completed in ${time}ms. ${images.length} files processed.`)
  }

  /**
   * Optimize images from a given input directory, and copy them to a given output directory.
   *
   * @param {Directory} directory directory
   * @param {string} output directory
   *
   * @returns array of copied filenames
   */
  protected async copyImages(directory: Directory, output: string): Promise<Result[]> {
    const outputDir = directory.path.replace(directory.basePath, '')
    return imagemin([`${directory.path}/*.{jpg,jpeg,png,svg,gif}`], join(output, outputDir), {
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
  protected async createWebpFiles(directory: Directory, output: string): Promise<string[]> {
    let renamed: string[] = []
    const outputDir = directory.path.replace(directory.basePath, '')
    for (const extension of ['jpg', 'png']) {
      const files = await imagemin([`${directory.path}/*.${extension}`], join(output, outputDir), {
        plugins: [imageminWebp()]
      })
      const result = await this.renameWebpFiles(files.map((file: Result) => file.path), extension)
      renamed = [...renamed, ...result]
    }
    return renamed
  }

  /**
   * Rename webp files for better compatibility with nginx:
   * `cat.webp` -> `cat.jpg.webp`
   *
   * @param files
   * @param extension
   */
  protected async renameWebpFiles(files: string[], extension: string): Promise<string[]> {
    const renamed: string[] = []
    for (const file of files) {
      const name = basename(file, extname(file))
      const dir = dirname(file)
      const newName = `${dir}/${name}.${extension}.webp`
      await rename(file, newName)
      renamed.push(newName)
    }
    return renamed
  }

  protected printResults(images: string[]): void {
    const table = new Table({
      head: ['Image path', 'Type', 'Size'],
      style: {
        head: ['cyan', 'bold']
      }
    })
    for (const image of images) {
      const info = getFileInformation(image)
      if (info.type === 'WEBP') {
        table.push([image, info.type, chalk.bgCyan(info.size)])
      } else {
        table.push([image, info.type, chalk.bgGreen(info.size)])
      }
    }
    console.log(table.toString())
  }

  /**
   * Get the resolved configuration options.
   *
   * @param options
   */
  protected getConfiguration(options?: Options): Options {
    return Object.assign(
      {
        optimize: true,
        webp: false
      },
      options
    )
  }
}
