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
    this.scriptPath = require(path.join(this.cwd, 'package')).main;
    this.port = 3000;
  };

  public start () {
    nodemon({
      script: path.join(this.cwd, this.scriptPath),
      restartable: 'rs',
      ignore: ['.git', 'node_modules'],
      watch: [path.join(this.cwd,'**/*.js')],
      stdin: true,
      verbose: true,
      stdout: true
    })
  }
}

export = ServerRunner;
