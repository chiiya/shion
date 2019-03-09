export type Options = {
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
}

export type FileInformation = {
  path: string,
  size: string,
  type: string,
}

export type Directory = {
  basePath: string,
  path: string,
}
