import Logger from './logger'
import { OptimizeOptions, Input, Result } from '../types/types'
import { getFilesRecursive } from './helpers'
import { cpus } from 'os'
import Table from 'cli-table'
import chalk from 'chalk'
import Processor from './processor'
const { ensureDir } = require('fs-extra')
const { Sema } = require('async-sema')

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
  public async images(input: string[] | string, output: string, options?: OptimizeOptions) {
    this.logger.log('Executing image task.')
    this.logger.spin('Optimizing images...')
    const start: number = new Date().getTime()
    let results: Result[] = []

    try {
      results = await this.optimizeImages(input, output, options)
    } catch (error) {
      this.logger.error(`${error.message}\n${error.stack}`)
    }

    this.logger.stop()
    this.printResults(results)
    const time = new Date().getTime() - start
    this.logger.log(`Image task completed in ${time}ms. ${results.length} files processed.`)
  }

  /**
   * Optimize images.
   * @param input
   * @param output
   * @param options
   */
  protected async optimizeImages(
    input: string[] | string,
    output: string,
    options?: OptimizeOptions
  ): Promise<Result[]> {
    const configuration = this.getConfiguration(options)
    let files: Input[] = []
    let results: Result[] = []

    if (Array.isArray(input)) {
      input = [...input]
    } else {
      input = [input]
    }

    // Get a list of all files contained in the input directories
    input.map((dirname: string) => {
      try {
        const foundFiles = getFilesRecursive(dirname)
        for (const file of foundFiles) {
          files.push({ basedir: dirname, fullPath: file })
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.error(`File or directory not found.\n${error.message}`)
        } else throw error
      }
    })

    const s = new Sema(cpus().length, { capacity: files.length })

    // Optimize or copy images, depending on configuration
    await Promise.all(
      files.map(async (file: Input) => {
        await s.acquire()
        let result
        const outputData = Processor.getOutputData(file, output)
        await ensureDir(output)
        if (configuration.optimize === true) {
          result = await Processor.optimizeImage(file, outputData, configuration)
        } else {
          result = await Processor.copyImage(file, outputData)
        }

        results = [...results, ...result]
        s.release()
      })
    )

    return results
  }

  /**
   * Print the results of the optimization task as a table.
   * @param results
   */
  protected printResults(results: Result[]): void {
    const table = new Table({
      head: ['Image path', 'Type', 'Original Size', 'New Size'],
      style: {
        head: ['cyan', 'bold']
      }
    })
    for (const image of results) {
      table.push([
        image.path,
        image.type === 'WEBP' ? chalk.cyan(image.type) : image.type,
        chalk.magentaBright(image.originalSize),
        chalk.magentaBright(image.newSize)
      ])
    }
    console.log(table.toString())
  }

  /**
   * Get the resolved configuration options.
   * @param options
   */
  protected getConfiguration(options?: OptimizeOptions): OptimizeOptions {
    return Object.assign(
      {
        optimize: true,
        webp: false,
        mozJpeg: {
          quality: 80
        },
        pngQuant: {},
        svgo: {
          removeViewBox: true
        },
        gifSicle: {
          optimizationLevel: 3
        }
      },
      options
    )
  }
}
