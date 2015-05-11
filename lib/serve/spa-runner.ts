import WebpackDevServer = require("webpack-dev-server");
import Webpack = require("webpack");
import path = require('path');
import fs = require('fs');

import ServerRunner = require('./server-runner');
import log = require('../log');

class SpaRunner {

  private cwd: string;
  private serverRunner: ServerRunner;
  private port: number;
  private webpackFileName: string = 'webpack.config.js';
  private webPackConfigPath: string;

  constructor(cwd: string, serverRunner: ServerRunner) {
    this.cwd = cwd;
    this.serverRunner = serverRunner;
    this.port = 8080;
    this.webPackConfigPath = path.join(this.cwd, this.webpackFileName);
  };

  private checkConfigPath() {
    if (!fs.existsSync(this.webPackConfigPath)) {
      throw Error('No ' + this.webpackFileName + ' exists for project ' + this.cwd);
    }
  }

  public start () {
    this.checkConfigPath();

    var webPackOpts = require(this.webPackConfigPath);
    var webPack = Webpack(webPackOpts);
    var devServerConfig = {
      contentBase: webPack.options.output.path,
      proxy: {
        '/\/api(.*)/': "localhost:" + this.serverRunner.port
      }
    }

    new WebpackDevServer(webPack, devServerConfig)
      .listen(this.port, () => {});
  }
}

export = SpaRunner;
