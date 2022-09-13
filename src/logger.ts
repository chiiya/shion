const { Signale } = require('signale')
const chalk = require('chalk')
const Ora = require('ora')

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
   * Stop the spinner, set it to green, and persist it.
   * @param {string} message
   */
  succeed(message: string) {
    if (this.spinner.isSpinning) {
      this.spinner.succeed(message)
    }
  }

  /**
   * Stop the spinner, set it to red, and persist it.
   * @param {string} message
   */
  fail(message: string) {
    if (this.spinner.isSpinning) {
      this.spinner.fail(message)
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
