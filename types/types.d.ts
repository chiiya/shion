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

export type FileInformation = {
  path: string,
  size: string,
  type: string,
}

export type Input = {
  basedir: string,
  fullPath: string,
}

export type Result = {
  path: string,
  originalSize: string,
  newSize: string,
  type: string,
}

export type Output = {
  basedir: string,
  dir: string,
  filename: string,
  fullPath: string,
}
