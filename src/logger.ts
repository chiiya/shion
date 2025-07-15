import consola from 'consola';
import chalk from 'chalk';
import ora from 'ora';

export default class Logger {
  protected logger = consola.withTag('🌺 shion');
  protected spinner = ora({ spinner: 'circleHalves' });

  /**
   * Log a message to the console.
   */
  log(message: string) {
    this.logger.info(message);
  }

  /**
   * Log an error message to the console.
   */
  error(message: string) {
    this.stop();
    this.logger.error(chalk.red(message));
    process.exit(-1);
  }

  /**
   * Start spinning the spinner instance.
   */
  spin(message: string) {
    this.spinner.text = message;
    if (!this.spinner.isSpinning) {
      this.spinner.start();
    }
  }

  /**
   * Print a warning message to console.
   */
  warn(message: string) {
    this.logger.warn(message);
  }

  /**
   * Stop and remove the spinner.
   */
  stop() {
    this.spinner.stop();
  }
}
