import Logger from './logger'
import { Options, File, Result } from '../types/types'
import { getFilesRecursive, getFileInformation, formatSize } from './helpers'
import { basename, dirname, extname, join } from 'path'
import { buffer as imageminBuffer } from 'imagemin'
import { cpus } from 'os'
import Table from 'cli-table'
import chalk from 'chalk'
const { rename, existsSync, readFile, copyFile, writeFile, ensureDir } = require('fs-extra')
const { Sema } = require('async-sema')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminSvgo = require('imagemin-svgo')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminWebp = require('imagemin-webp')
const imageminGifsicle = require('imagemin-gifsicle')

export default class Asebi {
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
    let files: File[] = []
    let results: Result[] = []

    if (Array.isArray(input)) {
      input = [...input]
    } else {
      input = [input]
    }

    // Get a list of all files contained in the input directories
    input.map((dirname: string) => {
      if (existsSync(dirname) === false) {
        this.logger.stop()
        this.logger.error(`Directory not found ${dirname}`)
        process.exit(-1)
      }
      const foundFiles = getFilesRecursive(dirname)
      for (const file of foundFiles) {
        files.push({ basePath: dirname, path: file })
      }
    })

    const s = new Sema(cpus().length, { capacity: files.length })

    // Optimize or copy images, depending on configuration
    await Promise.all(
      files.map(async (file: File) => {
        await s.acquire()
        let result
        if (configuration.optimize === true) {
          result = await this.optimizeImage(file, output, configuration)
        } else {
          result = await this.copyImage(file, output)
        }

        results = [...results, ...result]
        s.release()
      })
    )

    this.logger.stop()
    this.printResults(results)
    const time = new Date().getTime() - start
    this.logger.log(`Image task completed in ${time}ms. ${results.length} files processed.`)
  }

  protected async optimizeImage(
    file: File,
    output: string,
    configuration: Options
  ): Promise<Result[]> {
    const filename = basename(file.path)
    const outputDir = join(output, file.path.replace(file.basePath, '').replace(filename, ''))
    await ensureDir(outputDir)
    const destination = join(process.cwd(), outputDir, filename)
    const extension = extname(destination)
      .substr(1)
      .toUpperCase()
    const buffer = await readFile(file.path)
    const originalSize = buffer.length
    const optimizedBuffer = await imageminBuffer(buffer, {
      plugins: [
        imageminMozjpeg({ quality: 80 }),
        imageminPngquant(),
        imageminSvgo({ removeViewBox: true }),
        imageminGifsicle({ optimizationLevel: 3 })
      ]
    })
    const newSize = optimizedBuffer.length
    if (originalSize < newSize) {
      return await this.copyImage(file, output)
    }
    await writeFile(destination, buffer)
    const results: Result[] = [
      {
        path: join(outputDir, filename),
        originalSize: formatSize(originalSize),
        newSize: formatSize(newSize),
        type: extension
      }
    ]
    if (configuration.webp === true && ['JPG', 'JPEG', 'PNG'].includes(extension)) {
      const webPBuffer = await imageminBuffer(buffer, {
        plugins: [imageminWebp()]
      })
      await writeFile(`${destination}.webp`, webPBuffer)
      results.push({
        path: join(outputDir, `${filename}.webp`),
        originalSize: formatSize(originalSize),
        newSize: formatSize(webPBuffer.length),
        type: 'WEBP'
      })
    }
    return results
  }

  protected async copyImage(file: File, output: string): Promise<Result[]> {
    const filename = basename(file.path)
    const outputDir = join(output, file.path.replace(file.basePath, '').replace(filename, ''))
    await ensureDir(outputDir)
    const destination = join(process.cwd(), outputDir, filename)
    const information = getFileInformation(file.path)
    await copyFile(file.path, destination)
    return [
      {
        path: join(outputDir, filename),
        originalSize: information.size,
        newSize: information.size,
        type: information.type
      }
    ]
  }

  protected printResults(results: Result[]): void {
    const table = new Table({
      head: ['Image path', 'Type', 'Original Size', 'New Size'],
      style: {
        head: ['cyan', 'bold']
      }
    })
    for (const image of results) {
      if (image.type === 'WEBP') {
        table.push([
          image.path,
          image.type,
          chalk.bgCyan(image.originalSize),
          chalk.bgCyan(image.newSize)
        ])
      } else {
        table.push([
          image.path,
          image.type,
          chalk.bgGreen(image.originalSize),
          chalk.bgGreen(image.newSize)
        ])
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
