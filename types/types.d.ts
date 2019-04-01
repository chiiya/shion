export type OptimizeOptions = {
  /**
   * Set to to `true` to automatically generate webp versions of each image file.
   *
   * @default false
   */
  webp?: boolean,

  /**
   * Set to to `true` to optimize images with imagemin.
   *
   * @default true
   */
  optimize?: boolean,
  mozJpeg: any
  pngQuant: any,
  svgo: any,
  gifSicle: any,
}

export type ResizeOptions = OptimizeOptions & {
  /**
   * Set the sizes (width) that you wish to generate.
   * Can be a single size (e.g. 240) or multiple (e.g. [240, 480])
   */
  sizes: number | number[]
}

export type FileInformation = {
  path: string,
  size: string,
  type: string,
}

export type Input = {
  basedir: string,
  fullPath: string,
}

export type OptimizeResult = {
  path: string,
  originalSize: string,
  newSize: string,
  type: string,
}

export type ResizeResult = {
  path: string,
  originalSize: string,
  newSize: string,
  type: string,
  size: number,
}

export type Output = {
  basedir: string,
  dir: string,
  filename: string,
  fullPath: string,
}
