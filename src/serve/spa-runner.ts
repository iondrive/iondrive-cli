import WebpackDevServer = require("webpack-dev-server");
import Webpack = require("webpack");
import path = require('path');
import fs = require('fs');

import ServerRunner = require('./server-runner');
import log = require('../log');

interface ISpaOpts {
  port: number;
  hot: boolean;
  noProxy: boolean;
  webpackConfigPath: string;
}

class SpaRunner {

  private webpackFileName: string = 'webpack.config.js';

  private cwd: string;
  private serverRunner: ServerRunner;

  private hot: boolean = false;
  private port: number = 8080;
  private noProxy: boolean = false;
  private webPackConfigPath: string;

  constructor(cwd: string, serverRunner: ServerRunner, opts?: ISpaOpts) {
    this.cwd = cwd;
    this.serverRunner = serverRunner;

    this.hot = (opts && opts.hot) || this.hot;
    this.port = (opts && opts.port) || this.port;
    this.webPackConfigPath = (opts && opts.webpackConfigPath) || path.join(this.cwd, this.webpackFileName);
    this.noProxy = (opts && opts.noProxy) || this.noProxy;
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

      webPackOpts.entry.push('webpack-dev-server/client?http://localhost:' + this.port)
      webPackOpts.entry.push('webpack/hot/dev-server');
      webPackOpts.plugins = webPackOpts.plugins || [];
      webPackOpts.plugins.push(new Webpack.HotModuleReplacementPlugin());
    }

    var webPack = Webpack(webPackOpts);
    var devServerConfig = webPackOpts.devServer || {};
    devServerConfig.hot = this.hot;
    //devServerConfig.inline = this.hot;
    devServerConfig.quiet = false;
    devServerConfig.noInfo = false;
    devServerConfig.stats = { colors: true };
    devServerConfig.contentBase = webPack.options.output.path;

    if (devServerConfig.proxy && !this.noProxy) {
      var hostPortRegexp = new RegExp("^(.*:)//([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$");
      var serverHostName = 'http://' + this.serverRunner.host + ':' + this.serverRunner.port;
      Object.keys(devServerConfig.proxy).forEach((key) => {
        devServerConfig.proxy[key] = devServerConfig.proxy[key].replace(hostPortRegexp, serverHostName);
      });
    }

    new WebpackDevServer(webPack, devServerConfig)
      .listen(this.port, () => {});
  }
}

export = SpaRunner;
