import fs = require('fs');
import path = require('path');

import chalk = require('chalk');
import ClientRunner = require('./ClientRunner');
import ServerRunner = require('./ServerRunner');

const CLIENT_SUFFIXES = ['client', 'app', 'spa', 'frontend'];
const SERVER_SUFFIXES = ['server', 'api', 'backend'];

class Runner {
  private runnerDir: string;
  private package: { name: string };
  private rootModuleName: string;
  private serverRunner: ServerRunner;
  private clientRunner: ClientRunner;

  constructor(runnerDir: string, opts?: any) {
    this.runnerDir = runnerDir;

    try {
      this.package = require(path.join(this.runnerDir, './package'));
    } catch (e) {
      console.error(chalk.red('ERR!'), 'No package.json in current directory.', this.runnerDir);
      process.exit(1);
    }

    this.rootModuleName = this.package.name.split('-')[0];

    if (this.isClient()) {
      this.serverRunner = new ServerRunner(this.findServerPath());
      opts.serverHost = this.serverRunner.host;
      opts.serverPort = this.serverRunner.port;
      this.clientRunner = new ClientRunner(this.runnerDir, opts);
    }
    else if (this.isServer()) {
      if (opts.cordova) {
        console.error(chalk.red('ERR!'), 'Cordova can only run from client projects.');
        process.exit(1);
      }
      this.serverRunner = new ServerRunner(this.runnerDir);
    }
  }

  public start() {
    this.serverRunner.start();
    if (this.clientRunner) this.clientRunner.start();
  }

  private isClient() {
    return new RegExp('(' + CLIENT_SUFFIXES.join('|') + ')$').test(this.package.name);
  }

  private isServer() {
    return new RegExp('(' + SERVER_SUFFIXES.join('|') + ')$').test(this.package.name);
  }

  private findServerPath() {
    var parentPath = path.join(this.runnerDir, '..');

    for (var i = 0; i < SERVER_SUFFIXES.length; i++) {
      var serverPath = path.join(parentPath, this.rootModuleName + '-' + SERVER_SUFFIXES[i]);
      if (fs.existsSync(serverPath)) {
        return serverPath;
      }
    }
  }
}

export = Runner;
