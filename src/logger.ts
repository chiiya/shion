const { Signale } = require('signale')
import chalk from 'chalk'
import Ora from 'ora'

// Signale options
const options = {
  disabled: false,
  interactive: false,
  stream: process.stdout,
  displayTimestamp: true,
  types: {
    shion: {
      badge: '🌺',
      color: 'magentaBright',
      label: 'shion',
    },
  },
}

/**
 * Logger class
 * Used for custom console logging.
 */
export default class Logger {
  protected console: any
  protected spinner: any

  /**
   * Logger constructor
   */
  constructor() {
    // @ts-ignore
    this.console = new Signale(options)
    this.console.config({ displayTimestamp: true })
    // @ts-ignore
    this.spinner = new Ora({ spinner: 'circleHalves' })
  }

  /**
   * Log a console message using the shion style defined above.
   * @param {string} message
   */
  log(message: string) {
    // @ts-ignore
    this.console.shion(message)
  }

  /**
   * Log an error message to the console
   * @param {string} message
   */
  error(message: string) {
    this.stop()
    this.console.error(chalk.red(message))
    process.exit(-1)
  }

  /**
   * Start spinning the spinner instance.
   * @param {string} message
   */
  spin(message: string) {
    this.spinner.text = message
    if (!this.spinner.isSpinning) {
      this.spinner.start()
    }
  }

  /**
   * Print a warning message to console.
   * @param message
   */
  warn(message: string) {
    this.console.warn(message)
  }

  /**
   * Stop and remove the spinner.
   */
  stop() {
    this.spinner.stop()
  }
}
