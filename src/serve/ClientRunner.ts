import fs = require('fs');
import path = require('path');
import http = require('http');
import childProcess = require('child_process');


import rimraf = require('rimraf');
import chalk = require('chalk');
import webpack = require("webpack");
import WebpackDevServer = require("webpack-dev-server");
import _ = require('lodash');

import network = require('../network');
import env = require('../env');

interface ModuleEnvs {
  API_URI: string
}

interface ClientOpts {
  port: number;
  hot: boolean;
  proxy: boolean;
  webpackConfigPath: string;
  cordova: string;
  device: boolean;
  lan: boolean;
}

const WEBPACK_FILENAME = 'webpack.config.js';

class ClientRunner {
  private clientDir: string;

  private hot: boolean = false;
  private port: number = 8080;
  private host: string = 'localhost';
  private proxy: boolean = false;
  private webpackConfigPath: string;

  private cordova: string;
  private device: boolean = false;
  private compilerDone: boolean = false;

  constructor(clientDir: string, opts?: ClientOpts) {
    this.clientDir = clientDir;

    this.device = (opts && opts.device) || this.device;
    this.host = (opts && opts.device || opts.lan) ? network.getLanIp() : this.host;
    this.port = (opts && opts.port) || this.port;
    this.hot = (opts && opts.hot) || this.hot;
    this.proxy = opts ? !opts.lan : (opts.proxy || this.proxy);
    this.webpackConfigPath = (opts && opts.webpackConfigPath) || path.join(this.clientDir, WEBPACK_FILENAME);
    this.cordova = (opts && opts.cordova) || this.cordova;
  }

  private checkWebpackConfigPath() {
    if (!fs.existsSync(this.webpackConfigPath)) {
      console.error(chalk.red('Error!'), this.webpackConfigPath + ' can\'t be found in ' + this.clientDir);
      process.exit(1);
    }
  }

  public start() {
    this.checkWebpackConfigPath();
    var projectEnv = _.extend(process.env, env.configure(this.clientDir, this.host, this.port));
    var webpackOpts = require(this.webpackConfigPath);

    if (this.hot) {
      var mainEntry = webpackOpts.entry.app || webpackOpts.entry;
      mainEntry.push('webpack-dev-server/client?http://' + this.host + ':' + this.port)
      mainEntry.push('webpack/hot/dev-server');
      webpackOpts.plugins = webpackOpts.plugins || [];
      webpackOpts.plugins.push(new webpack.HotModuleReplacementPlugin());

      // delete and previous outputs as webpack-dev-server hosts all in memory.
      rimraf.sync(webpackOpts.output.path + '/*');
    }

    var devServerConfig = webpackOpts.devServer || {};
    devServerConfig.hot = this.hot;
    devServerConfig.inline = this.hot;
    devServerConfig.quiet = false;
    devServerConfig.noInfo = false;
    devServerConfig.stats = { colors: true };
    devServerConfig.contentBase = webpackOpts.output.path;

    if (this.proxy && webpackOpts.devServer.proxy && !this.device) {
      const URI_REGEXP = new RegExp("^(.*:)//([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$");
      webpackOpts.plugins.forEach((plugin) => {
        Object.keys(plugin).forEach((key) => {
         // signals DefinePlugin
          if (key === 'definitions') {
            var definitions = plugin[key];
            Object.keys(definitions).forEach((propKey) => {
              var defineConst = (plugin[key][propKey] || "").replace(/['"]+/g, '');
              plugin[key][propKey] = JSON.stringify(defineConst.replace(URI_REGEXP, `http://$2:${this.port}$4`));
            })
          }
        })
      })
    }

    var compiler = webpack(webpackOpts);
    if (this.cordova) {
      if (this.hot) {
        // cordova requires an index.html page. So create one and address webpack-dev-server assets
        webpackOpts.output.publicPath = 'http://' + this.host + ':' + this.port + '/';
      }

      compiler.plugin('done', (stats) => {
        if (this.compilerDone) return;
        this.compilerDone = true;
        // if we're in hot mode create an index.html file which references the webpack-dev-server assets
        if (this.hot) {
          var indexAsset = stats.compilation.assets['index.html'];
          if (indexAsset) {
            fs.writeFileSync(path.join(devServerConfig.contentBase, 'index.html'), indexAsset.source())
          }
        }

        var device = childProcess.spawn('ionic', ['run', this.cordova, (this.device ? ' --device' : '')], {
          cwd: path.resolve(devServerConfig.contentBase, '..'),
          env: projectEnv,
          stdio: 'inherit'
        });

        console.log(chalk.green(this.cordova + ' simulator'), (this.hot ? 'connected to webpack-dev-server ' + chalk.magenta('in hot mode') : 'running local assets'));
      });

    }

    if (this.cordova && !this.hot) {
      console.log(chalk.green('webpack'), 'compiling assets for', this.cordova, '...');
      compiler.run(() => {
        console.log(chalk.green('webpack'), 'compiled assets for', this.cordova);
      })
    } else {
      new WebpackDevServer(compiler, devServerConfig)
        .listen(this.port, () => {
          console.log(chalk.green('webpack-dev-server'), `running at http://${this.host}:${this.port}`, this.hot ? chalk.magenta('in hot mode'): '');
          Object.keys(devServerConfig.proxy).forEach((proxyPath) => {
            console.log(chalk.green('proxy ' + proxyPath + ' server'), `running at http://${this.host}:${this.port}` + proxyPath);
          });
        });
    }

  }
}

export = ClientRunner;
