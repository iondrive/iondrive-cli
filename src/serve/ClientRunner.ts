import fs = require('fs');
import path = require('path');

import chalk = require('chalk');
import webpack = require("webpack");
import WebpackDevServer = require("webpack-dev-server");

interface ClientOpts {
  port: number;
  hot: boolean;
  proxy: boolean;
  webpackConfigPath: string;

  serverHost: string;
  serverPort: number;
}

const WEBPACK_FILENAME = 'webpack.config.js';

class ClientRunner {
  private clientDir: string;

  private hot: boolean = false;
  private port: number = 8080;
  private proxy: boolean = false;
  private webpackConfigPath: string;

  private serverHost: string;
  private serverPort: number;

  constructor(clientDir: string, opts?: ClientOpts) {
    this.clientDir = clientDir;

    this.port = (opts && opts.port) || this.port;
    this.hot = (opts && opts.hot) || this.hot;
    this.proxy = (opts && opts.proxy) || this.proxy;
    this.webpackConfigPath = (opts && opts.webpackConfigPath) || path.join(this.clientDir, WEBPACK_FILENAME);

    this.serverHost = (opts && opts.serverHost) || this.serverHost;
    this.serverPort = (opts && opts.serverPort) || this.serverPort;
  }

  private checkWebpackConfigPath() {
    if (!fs.existsSync(this.webpackConfigPath)) {
      console.error(chalk.red('Error!'), this.webpackConfigPath + ' can\'t be found in ' + this.clientDir);
      process.exit(1);
    }
  }

  public start() {
    this.checkWebpackConfigPath();

    var webpackOpts = require(this.webpackConfigPath);

    if (this.hot) {
      webpackOpts.entry.push('webpack-dev-server/client?http://localhost:' + this.port)
      webpackOpts.entry.push('webpack/hot/dev-server');
      webpackOpts.plugins = webpackOpts.plugins || [];
      webpackOpts.plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    var compiler = webpack(webpackOpts);

    var devServerConfig = webpackOpts.devServer || {};
    devServerConfig.hot = this.hot;
    //devServerConfig.inline = this.hot;
    devServerConfig.quiet = false;
    devServerConfig.noInfo = false;
    devServerConfig.stats = { colors: true };
    devServerConfig.contentBase = compiler.options.output.path;

    new WebpackDevServer(compiler, devServerConfig)
      .listen(this.port, () => {});
  }
}

export = ClientRunner;
