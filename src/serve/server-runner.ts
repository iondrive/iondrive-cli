import path = require('path');
import fs = require('fs');
import nodemon = require('nodemon');

import SpaRunner = require('./spa-runner');
import log = require('../log');

interface IServerOpts {
  port: number;
  host: string;
}

class ServerRunner {

  private cwd: string;
  private scriptPath: string;

  public port: number = 3000;
  public host: string = 'localhost';

  constructor(cwd: string, opts?: IServerOpts) {
    this.cwd = cwd;
    this.scriptPath = require(path.join(this.cwd, 'package')).main;
    this.port = (opts && opts.port) || this.port;
    this.host = (opts && opts.host) || this.host;
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
