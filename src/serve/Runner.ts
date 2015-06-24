import fs = require('fs');
import path = require('path');
import _ = require('lodash');
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
      console.error(chalk.red('ERR!'), 'No package.json in current directory.', runnerDir);
      process.exit(1);
    }

    this.rootModuleName = this.package.name.split('-')[0];
    var projectPackages = glob.sync(path.resolve(this.runnerDir, '../*/package.json')).map(packageDir => {
      var project = require(packageDir);
      project.dir = path.dirname(packageDir);
      return project;
    });

    var dependencies = this.package['iondrive'].dependencies || [];

    if (this.isClient()) {
      this.servers = dependencies.map((dependency) => {
        var project = _.findWhere(projectPackages, { name: dependency });
        return new ServerRunner(project['dir'], opts);
      });

      this.mainServer = this.findMainServer();
      opts.serverHost = this.mainServer.host;
      opts.serverPort = this.mainServer.port;

      this.client = new ClientRunner(this.runnerDir, opts)
    } else {
      if (opts.cordova) {
        console.error(chalk.red('ERR!'), 'Cordova can only run from client projects.');
        process.exit(1);
      }

      if (opts.all) {
        this.servers = dependencies.map((dependency) => {
          var project = _.findWhere(projectPackages, { name: dependency });
          return new ServerRunner(project['dir'], opts);
        });
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
    return this.package['iondrive'] && this.package['iondrive']['type'] === 'client';
  }
}

export = Runner;
