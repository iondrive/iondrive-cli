import path = require('path');
import fs = require('fs');
import nodemon = require('nodemon');

import SpaRunner = require('./spa-runner');
import log = require('../log');

class ServerRunner {

  private cwd: string;
  private scriptPath: string;

  public port: number;

  constructor(cwd: string) {
    this.cwd = cwd;
    this.scriptPath = this.getPackageJson(this.cwd).main;
    this.port = 3000;
  };

  private getPackageJson(targetPath?: string) {
    return JSON.parse(fs.readFileSync(path.join(targetPath, 'package.json'), 'utf8'));
  }

  public start () {
    var np = nodemon({
      script: path.join(this.cwd, this.scriptPath),
      ext: 'js json',
      port: this.port,
      verbose: true
    });
  }
}

export = ServerRunner;
