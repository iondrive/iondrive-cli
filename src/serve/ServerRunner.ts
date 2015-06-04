import path = require('path');
import httpProxy = require('http-proxy');
import chalk = require('chalk');
import fs = require('fs');
import nodemon = require('nodemon');

interface ServerOpts {
  port?: number;
  host?: string;
}

class ServerRunner {
  private serverDir: string;
  private package: { main: string };
  private env = {};

  public host: string = 'localhost';
  public port: number = 3000;

  public target: string;

  constructor(serverDir: string, opts?: ServerOpts) {
    this.serverDir = serverDir;

    try {
      this.package = require(path.join(this.serverDir, './package'));
    } catch (e) {
      console.error(chalk.red('ERR!'), 'No package.json in current directory.', this.serverDir);
      process.exit(1);
    }

    this.host = (opts && opts.host) || this.host;
    this.port = (opts && opts.port) || this.port;
  }

  private setEnv() {
    try {
      this.env = require(path.join(this.serverDir, './env/development'));
    } catch (e) {}
  }

  public start() {
    this.setEnv();

    nodemon({
      script: path.join(this.serverDir, this.package.main),
      restartable: 'rs',
      env: this.env,
      ignore: ['.git', 'node_modules'],
      watch: [path.join(this.serverDir, '**/*.js')],
      stdin: true,
      verbose: true,
      stdout: true
    });

    console.log(chalk.green('backend server'), `running at http://localhost:${this.port}`);
  }
}

export = ServerRunner;
