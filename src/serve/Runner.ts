import fs = require('fs');
import path = require('path');
import _ = require('lodash');
import chalk = require('chalk');
import glob = require('glob');

import ClientRunner = require('./ClientRunner');
import ServerRunner = require('./ServerRunner');

class Runner {
    private moduleDir: string;
    private moduleName: string;
    private moduleType: string;

    private servers: Array<ServerRunner> = [];
    private clients: Array<ClientRunner> = [];

    constructor(runnerDir: string, opts: any) {
      this.moduleDir = runnerDir;
      try {
        var packageJson = require(path.join(this.moduleDir, './package'));
        this.moduleName = packageJson.name;
        this.moduleType = packageJson.iondrive.type;
      } catch (e) {
        console.error(chalk.red('ERR!'), 'No package.json in current directory.', this.moduleDir);
        process.exit(1);
      }

      if (this.isClient()) {
        this.loadAllDependencies(opts);
      } else {
        if (opts.cordova) {
          console.error(chalk.red('ERR!'), 'Cordova can only run from client projects.');
          process.exit(1);
        }

        if (opts.all) {
          this.loadAllDependencies(opts);
        } else {
          this.servers.push(new ServerRunner(this.moduleDir, opts));
        }
      }
    }

    public start() {
      this.servers.forEach(function (server) {
        server.start();
      });
      this.clients.forEach(function (client) {
        client.start();
      });
    }

    private isClient() {
      return this.moduleType === 'client';
    }

    private loadAllDependencies(opts: any): void {
      glob.sync(path.resolve(this.moduleDir, '../*/package.json')).map(packageDir => {
        var project = require(packageDir);
        project.dir = path.dirname(packageDir);
        return project;
      }).forEach(project => {
        if (!project.iondrive) return;
        if (project.iondrive.type === 'client') {
          this.clients.push(new ClientRunner(project['dir'], opts))
        } else {
          this.servers.push(new ServerRunner(project['dir'], opts))
        }
      });
    }
}

export = Runner;
