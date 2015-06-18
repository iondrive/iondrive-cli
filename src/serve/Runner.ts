import fs = require('fs');
import path = require('path');

import chalk = require('chalk');
import glob = require('glob');

import ClientRunner = require('./ClientRunner');
import ServerRunner = require('./ServerRunner');

const CLIENT_SUFFIXES = ['client', 'app', 'spa', 'frontend'];
const SERVER_SUFFIXES = ['server', 'api', 'backend', 'website'];
const MAIN_SERVER_SUFFIXES = ['api', 'server', 'backend']; //ordered by priority

class Runner {
  private runnerDir: string;
  private package: { name: string };
  private rootModuleName: string;

  private servers: Array<ServerRunner> = [];
  private mainServer: ServerRunner;

  private client: ClientRunner;

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
      this.servers = glob.sync(path.join(this.runnerDir, `../${this.rootModuleName}-{${SERVER_SUFFIXES.toString()}}/`))
      .map((dir) => { return new ServerRunner(dir, opts); });
      this.mainServer = this.findMainServer();

      opts.serverHost = this.mainServer.host;
      opts.serverPort = this.mainServer.port;
      this.client = new ClientRunner(this.runnerDir, opts)
    } else {
      if (opts.cordova) {
        console.error(chalk.red('ERR!'), 'Cordova can only run from client projects.');
        process.exit(1);
      }
      this.servers.push(new ServerRunner(this.runnerDir, opts));
    }
  }

  private findMainServer() {
    var mainServer;
    this.servers.forEach((server) => {
      MAIN_SERVER_SUFFIXES.forEach((suffix) => {
        if (server.name.indexOf(suffix, server.name.length - suffix.length) !== -1) {
          mainServer = server;
        }
      })
    });

    if (!mainServer) {
      console.error(chalk.red('ERR!'), 'Cannot find main server.');
      process.exit(1);
    }

    return mainServer;
  };

  public start() {
    this.servers.forEach(function (server) {
      server.start();
    });
    if (this.client) this.client.start();
  }

  private isClient() {
    return new RegExp('(' + CLIENT_SUFFIXES.join('|') + ')$').test(this.package.name);
  }
}

export = Runner;
