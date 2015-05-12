import WebpackDevServer = require("webpack-dev-server");
import Webpack = require("webpack");
import path = require('path');
import fs = require('fs');

import ServerRunner = require('./server-runner');
import log = require('../log');

class SpaRunner {

  private cwd: string;
  private serverRunner: ServerRunner;
  private hot: boolean = false;
  private port: number;
  private webpackFileName: string = 'webpack.config.js';
  private webPackConfigPath: string;

  constructor(cwd: string, serverRunner: ServerRunner, opts) {
    this.cwd = cwd;
    this.serverRunner = serverRunner;
    this.hot = opts.hot || false;
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

    if (this.hot) {
      webPackOpts.entry.push('webpack/hot/dev-server');
      webPackOpts.entry.push(path.join(__dirname, '../../node_modules/webpack-dev-server/client/index.js?http://localhost:' + this.port))
      webPackOpts.plugins = webPackOpts.plugins || [];
      webPackOpts.plugins.push(new Webpack.HotModuleReplacementPlugin());
    }

    var webPack = Webpack(webPackOpts);
    var devServerConfig = {
      hot: this.hot,
      quiet: false,
      noInfo: false,
      stats: { colors: true },
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
