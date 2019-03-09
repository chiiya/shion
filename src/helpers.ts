import { lstatSync, readdirSync } from 'fs'
import { join, extname } from 'path'
import { FileInformation } from '../types/types'

/**
 * Check whether a given file location is a directory.
 *
 * @param source
 */
export const isDirectory = (source: string): boolean => lstatSync(source).isDirectory()

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
 * Get a list of all sub-directories within a directory, recursively.
 *
 * @param source
 */
export const getDirectoriesRecursive = (source: string): string[] => {
  return [
    source,
    ...getDirectories(source)
      .map(getDirectoriesRecursive)
      .reduce((a, b) => a.concat(b), [])
  ]
}

/**
 * Get size and file type (extension) for a given file path.
 *
 * @param path
 */
export const getFileInformation = (path: string): FileInformation => {
  const stats = lstatSync(path)
  return {
    path,
    size: formatSize(stats.size),
    type: extname(path)
      .substr(1)
      .toUpperCase()
  }
}

const formatSize = (bytes: number): string => {
  if (bytes == 0) {
    return '0 Bytes'
  }
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}
