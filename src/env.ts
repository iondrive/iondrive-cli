import path = require('path');
import chalk = require('chalk');

const LOCALHOST_URI_REGEXP = new RegExp("^(.*:)//(localhost)(:[0-9]+)?(.*)$");

class Env {
  static configure (moduleDir: string, host: string, port: number) {
    var env = {};

    try {
      env = require(path.join(moduleDir, './env/development'));
      Object.keys(env).forEach((key) => {
        if (typeof env[key] == 'string') {
          env[key] = env[key].replace(LOCALHOST_URI_REGEXP, `http://${host}$3$4`);
        }
      });
    } catch (e) {
      console.error(chalk.red('ERR!'), 'Cannot find env file.', path.join(moduleDir, './env/development'));
      process.exit(1);
    }

    return env;
  }
}

export = Env;
