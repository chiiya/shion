import { statSync, readdirSync } from 'fs'
import { join, extname, resolve, normalize, isAbsolute } from 'path'
import { FileInformation } from '../types/types'

/**
 * Check whether a given file location is a directory.
 *
 * @param source
 */
export const isDirectory = (source: string): boolean => statSync(source).isDirectory()

/**
 * Check whether a given file location is a file.
 *
 * @param source
 */
export const isFile = (source: string): boolean => statSync(source).isFile()

/**
 * Check whether a given file is an image.
 *
 * @param source
 */
const isImage = (source: string): boolean => {
  const extension = extname(source)
    .substr(1)
    .toUpperCase()
  return ['JPG', 'PNG', 'GIF', 'JPEG', 'SVG'].includes(extension)
}

/**
 * Get a list of all directories contained within a directory.
 *
 * @param source
 */
export const getDirectories = (source: string): string[] => {
  return readdirSync(source)
    .map((name: string) => join(source, name))
    .filter(isDirectory)
}

/**
 * Get a list of all files contained within a directory.
 *
 * @param source
 */
export const getFiles = (source: string): string[] => {
  return readdirSync(source)
    .map((name: string) => join(source, name))
    .filter(isFile)
    .filter(isImage)
}

/**
 * Get a list of all files within a directory, recursively.
 *
 * @param source
 */
export const getFilesRecursive = (source: string): string[] => {
  const dirs = getDirectories(source)
  const files = dirs.map(dir => getFilesRecursive(dir)).reduce((a, b) => a.concat(b), [])
  return files.concat(getFiles(source))
}

/**
 * Get size and file type (extension) for a given file path.
 *
 * @param path
 */
export const getFileInformation = (path: string): FileInformation => {
  const stats = statSync(path)
  return {
    path,
    size: formatSize(stats.size),
    type: extname(path)
      .substr(1)
      .toUpperCase()
  }
}

/**
 * Format the byte size of a file into a nice human readable format.
 */
export const formatSize = (bytes: number): string => {
  if (bytes === 0) {
    return '0 Bytes'
  }
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get an input options that can be a string or an array of strings as
 * an array.
 */
export const getStringInputAsArray = (data: string | string[]): string[] => {
  if (Array.isArray(data)) {
    data = [...data]
  } else {
    data = [data]
  }
  return data
}

/**
 * Get an input options that can be a number or an array of numbers as
 * an array.
 */
export const getNumberInputAsArray = (data: number | number[]): number[] => {
  if (Array.isArray(data)) {
    data = [...data]
  } else {
    data = [data]
  }
  return data
}

/**
 * Check whether an item is an object.
 * @param item
 */
export const isObject = (item: any) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Check whether a given path is absolute or relative.
 * @param path
 */
export const isAbsolutePath = (path: string) => {
  return isAbsolute(path)
}

/**
 * Deep-merge to objects, since Object.assign only performs a shallow merge.
 * @param target
 * @param source
 */
export const mergeDeep = (target: any, source: any) => {
  let output = Object.assign({}, target)
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = mergeDeep(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}
