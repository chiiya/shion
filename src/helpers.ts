import { lstatSync, readdirSync } from 'fs'
import { join } from 'path'

/**
 * Check whether a given file location is a directory.
 *
 * @param source
 */
export const isDirectory = (source: string): boolean => lstatSync(source).isDirectory();

/**
 * Get a list of all directories contained within a directory.
 *
 * @param source
 */
export const getDirectories = (source: string): string[] => {
  return readdirSync(source)
    .map((name: string) => join(source, name))
    .filter(isDirectory);
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
  ];
}
