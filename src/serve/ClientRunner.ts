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
import safariDebugger = require('../debugger');
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
  debug: boolean;
  ssl: boolean
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
  private debugger: boolean = false;
  private forceSSL: boolean = false;

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
    this.debugger = (opts && opts.debug) || this.debugger;
    this.forceSSL = (opts && opts.ssl) || this.forceSSL;
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
    devServerConfig.https = this.forceSSL;
    devServerConfig.hot = this.hot;
    devServerConfig.inline = this.hot;
    devServerConfig.quiet = false;
    devServerConfig.noInfo = false;
    devServerConfig.stats = { colors: true };
    devServerConfig.contentBase = webpackOpts.output.path;
    devServerConfig.protcol = devServerConfig.https ? 'https': 'http';

    if (this.proxy && webpackOpts.devServer.proxy && !this.device) {
      const URI_REGEXP = new RegExp("^(.*:)//([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$");
      webpackOpts.plugins.forEach((plugin) => {
        Object.keys(plugin).forEach((key) => {
         // signals DefinePlugin
          if (key === 'definitions') {
            var definitions = plugin[key];
            Object.keys(definitions).forEach((propKey) => {
              var defineConst = (plugin[key][propKey] || "").replace(/['"]+/g, '');
              plugin[key][propKey] = JSON.stringify(defineConst.replace(URI_REGEXP, `${devServerConfig.protcol}://$2:${this.port}$4`));
            })
          }
        })
      })
    }

    var compiler = webpack(webpackOpts);
    if (this.cordova) {
      if (this.hot) {
        // cordova requires an index.html page. So create one and address webpack-dev-server assets
        webpackOpts.output.publicPath = `${devServerConfig.protcol}://${this.host}:${this.port}/`;
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
          env: projectEnv
        });

        device.stderr.pipe(process.stderr);
        device.stdout.pipe(process.stdout);

        if (this.debugger) {
          var deviceName;
          device.stdout.on('data', (data) => {
            if (this.device) {
              if (data.toString().indexOf('Starting debug of') > -1) {
                var remoteDebuggerInfo = data.toString();
                deviceName = remoteDebuggerInfo.substring(remoteDebuggerInfo.indexOf("'") + 1, remoteDebuggerInfo.lastIndexOf("'"));
              }

              if (data.toString().indexOf('Finished load of') > -1) {
                console.log(chalk.green(this.cordova + ' simulator'), (this.hot ? 'connected to webpack-dev-server ' + chalk.magenta('in hot mode') : 'running local assets'));
                safariDebugger.start(deviceName, 0, (err, res) => {
                  if (err) return console.log(chalk.red('ERR safari debugger'), err);
                  console.log(chalk.green('safari debugger'), ' connected to ', deviceName);
                });
              }
            } else {
              if (data.toString().indexOf('** RUN SUCCEEDED **') > -1) {
                deviceName = 'iOS Simulator';
                safariDebugger.start(deviceName, 4000, (err, res) => {
                  if (err) return console.log(chalk.red('ERR safari debugger'), err);
                  console.log(chalk.green('safari debugger'), 'connected to', deviceName);
                });
              }
            }

          });
        }
      });
    }

    if (this.cordova && !this.hot && !devServerConfig.https) {
      console.log(chalk.green('webpack'), 'compiling assets for', this.cordova, '...');
      compiler.run(() => {
        console.log(chalk.green('webpack'), 'compiled assets for', this.cordova);
      })
    } else {
      new WebpackDevServer(compiler, devServerConfig)
        .listen(this.port, () => {
          console.log(chalk.green('webpack-dev-server'), `running at ${devServerConfig.protcol}://${this.host}:${this.port}`, this.hot ? chalk.magenta('in hot mode'): '');
          Object.keys(devServerConfig.proxy).forEach((proxyPath) => {
            console.log(chalk.green('proxy server'), `running at ${devServerConfig.protcol}://${this.host}:${this.port}`);
          });
        });
    }

  }
}

export = ClientRunner;
