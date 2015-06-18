import path = require('path');
import child_process = require('child_process');

import chalk = require('chalk');
import _ = require('lodash');
import network = require('../network');

interface ServerOpts {
  port?: number;
  host?: string;
  device?: boolean;
}

class ServerRunner {
  private serverDir: string;
  private package: { main: string };
  private env = {};

  public host: string = 'localhost';
  public port: number = 3000;

  public target: string;
  public name: string;

  constructor(serverDir: string, opts?: ServerOpts) {
    this.serverDir = serverDir;

    try {
      this.package = require(path.join(this.serverDir, './package'));
    } catch (e) {
      console.error(chalk.red('ERR!'), 'No package.json in current directory.', this.serverDir);
      process.exit(1);
    }

    this.name = this.package['name'];
    this.host = (opts && opts.device) ? network.getLanIp() : this.host;
    this.setEnv();
  };

  private setEnv() {
    try {
      this.env = require(path.join(this.serverDir, './env/development'));
      this.port = this.env['APP_PORT'] || this.port;
    } catch (e) {}
  };

  public start() {
    var started = false;
    var child = child_process.spawn(path.join(__dirname, '../../node_modules/.bin/nodemon'), [
      this.package.main,
      '-e js',
      '--ignore .git',
      '--ignore node_modules',
    ], {
      cwd: this.serverDir,
      env: _.extend(this.env, process.env)
    })
    child.stderr.pipe(process.stderr);
    child.stdout.pipe(process.stdout);
    child.stdout.on('data', (data) => {
      if (data.toString().indexOf('listening') > -1 && !started) {
        console.log(chalk.green(this.name), `running at http://${this.host}:${this.port}`);
        started = true;
      }
    });
  };
}

export = ServerRunner;
