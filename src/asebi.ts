import Logger from './logger'
import {
  OptimizeOptions,
  Input,
  OptimizeResult,
  ResizeOptions,
  ResizeResult,
  ResizeTaskResult,
  ResolvedResizeOptions
} from '../types/types'
import { getFilesRecursive, getStringInputAsArray, mergeDeep } from './helpers'
import { cpus } from 'os'
import Table from 'cli-table'
import chalk from 'chalk'
import Processor from './processor'
import { extname, join } from 'path'
const { ensureDir } = require('fs-extra')
const { Sema } = require('async-sema')

export default class Asebi {
  protected logger: Logger
  protected processor: Processor

  constructor() {
    this.logger = new Logger()
    this.processor = new Processor()
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
    let results: OptimizeResult[] = []

    try {
      results = await this.optimizeImages(input, output, options)
    } catch (error) {
      this.logger.error(`${error.message}\n${error.stack}`)
    }

    this.logger.stop()
    this.printOptimizeResult(results)
    const time = new Date().getTime() - start
    this.logger.log(`Image task completed in ${time}ms. ${results.length} files processed.`)
  }

  public async resize(input: string[] | string, output: string, options: ResizeOptions) {
    this.logger.log('Executing resize task.')
    this.logger.spin('Resizing images...')
    const start: number = new Date().getTime()
    let result: ResizeTaskResult = { warnings: [], files: [] }

    try {
      result = await this.resizeImages(input, output, options)
    } catch (error) {
      this.logger.error(`${error.message}\n${error.stack}`)
    }

    this.logger.stop()
    this.printWarnings(result.warnings)
    this.printResizeResult(result.files)
    const time = new Date().getTime() - start
    this.logger.log(`Resize task completed in ${time}ms. ${result.files.length} files processed.`)
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
  ): Promise<OptimizeResult[]> {
    const configuration = this.getOptimizeConfiguration(options)
    let results: OptimizeResult[] = []
    input = getStringInputAsArray(input)
    const files = this.getFiles(input)
    const s = new Sema(cpus().length, { capacity: files.length })

    // Optimize or copy images, depending on configuration
    await Promise.all(
      files.map(async (file: Input) => {
        await s.acquire()
        let result
        const outputData = this.processor.getOutputData(file, output)
        await ensureDir(join(process.cwd(), outputData.dir))
        if (configuration.optimize === true) {
          result = await this.processor.optimizeImage(file, outputData, configuration)
        } else {
          result = await this.processor.copyImage(file, outputData)
        }

        results = [...results, ...result]
        s.release()
      })
    )

    return results
  }

  protected async resizeImages(
    input: string[] | string,
    output: string,
    options?: ResizeOptions
  ): Promise<ResizeTaskResult> {
    const configuration = this.getResizeConfiguration(options)
    const warnings: string[] = []
    let results: ResizeResult[] = []
    input = getStringInputAsArray(input)
    const files = this.getFiles(input)
    const s = new Sema(cpus().length, { capacity: files.length })

    // Optimize and resize or copy and resize images, depending on configuration
    await Promise.all(
      files.map(async (file: Input) => {
        await s.acquire()
        const outputData = this.processor.getOutputData(file, output)
        const extension = extname(outputData.filename)
          .substr(1)
          .toUpperCase()
        if (['JPEG', 'JPG', 'PNG', 'WEBP'].includes(extension) === false) {
          warnings.push(`${file.path} could not be resized (only JPEG, PNG and WEBP allowed)`)
          return
        }
        await ensureDir(join(process.cwd(), outputData.dir))
        const result = await this.processor.optimizeAndResize(file, outputData, configuration)

        results = [...results, ...result]
        s.release()
      })
    )

    return { warnings, files: results }
  }

  /**
   * Get a list of all files contained in the input directories.
   * @param input
   */
  protected getFiles(input: string[]): Input[] {
    const files: Input[] = []

    input.map((dirname: string) => {
      try {
        const foundFiles = getFilesRecursive(dirname)
        for (const file of foundFiles) {
          const path = file.substring(file.indexOf(dirname))
          files.push({ basedir: dirname, fullPath: file, path })
        }
      } catch (error) {
        if (error.code === 'ENOENT') {
          this.logger.error(`File or directory not found.\n${error.message}`)
        } else throw error
      }
    })

    return files
  }

  /**
   * Print the results of the optimization task as a table.
   * @param results
   */
  protected printOptimizeResult(results: OptimizeResult[]): void {
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
   * Print the results of the resize task as a table.
   * @param results
   */
  protected printResizeResult(results: ResizeResult[]): void {
    const table = new Table({
      head: ['Image path', 'Type', 'Width'],
      style: {
        head: ['cyan', 'bold']
      }
    })
    for (const image of results) {
      table.push([
        image.path,
        image.type === 'WEBP' ? chalk.cyan(image.type) : image.type,
        chalk.greenBright(`${image.size}`)
      ])
    }
    console.log(table.toString())
  }

  /**
   * Print generated warnings to console.
   * @param warnings
   */
  protected printWarnings(warnings: string[]): void {
    for (const warning of warnings) {
      this.logger.warn(warning)
    }
  }

  /**
   * Get the resolved configuration options for the optimize task.
   * @param options
   */
  protected getOptimizeConfiguration(options?: OptimizeOptions): OptimizeOptions {
    return mergeDeep(
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

  /**
   * Get the resolved configuration options for the optimize task.
   * @param options
   */
  protected getResizeConfiguration(options?: ResizeOptions): ResolvedResizeOptions {
    let defaults = {
      jpg: {
        force: false
      },
      png: {
        force: false
      },
      webp: {
        force: false
      }
    }
    if (options && options.optimize === true) {
      defaults = mergeDeep(
        {
          jpg: {
            quality: 75,
            chromaSubsampling: '4:4:4'
          }
        },
        defaults
      )
    }
    return mergeDeep(
      {
        pattern: '[name].[extension]',
        createWebpCopies: false,
        optimize: false,
        ...defaults
      },
      options
    )
  }
}
