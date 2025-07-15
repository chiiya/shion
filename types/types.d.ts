import { JpegOptions, PngOptions, WebpOptions } from 'sharp'

export type ResizeOptions = {
  /**
   * Set the sizes (width) that you wish to generate.
   * Can be a single size (e.g. 240) or multiple (e.g. [240, 480])
   */
  sizes: number | number[],

  /**
   * Specify the output file names. Available placeholders:
   * - [name]: original file name
   * - [size]: width of the new file
   * - [extension]: original file extension
   * An example would be `[name]_[size].[extension]` which would,
   * for example, create the file name `cat_240.jpg`
   *
   * @default `[name].[extension]`
   */
  pattern?: string,

  /**
   * Set to to `true` to automatically generate webp versions of each image file.
   *
   * @default false
   */
  createWebpCopies?: boolean,

  /**
   * Set to to `true` to optimize images with sharp.
   *
   * @default false
   */
  optimize?: boolean,

  jpg?: JpegOptions,
  png?: PngOptions,
  webp?: WebpOptions,
}

export type ResolvedResizeOptions = {
  sizes: number | number[],
  pattern: string,
  createWebpCopies: boolean,
  optimize: boolean,
  jpg: JpegOptions,
  png: PngOptions,
  webp: WebpOptions,
}

export type FileInformation = {
  path: string,
  size: string,
  type: string,
}

export type Input = {
  basedir: string,
  fullPath: string,
  path: string,
}

export type OptimizeResult = {
  path: string,
  originalSize: string,
  newSize: string,
  type: string,
}

export type ResizeResult = {
  path: string,
  type: string,
  size: number,
}

export type Output = {
  basedir: string,
  dir: string,
  filename: string,
  fullPath: string,
}

export type ResizeTaskResult = {
  warnings: string[],
  files: ResizeResult[]
}
