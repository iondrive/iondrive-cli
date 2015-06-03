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
      var mainEntry = webpackOpts.entry.app || webpackOpts.entry;

      mainEntry.push('webpack-dev-server/client?https://localhost:' + this.port)
      mainEntry.push('webpack/hot/dev-server');

      webpackOpts.plugins = webpackOpts.plugins || [];
      webpackOpts.plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    var devServerConfig = webpackOpts.devServer || {};
    devServerConfig.https = true;
    devServerConfig.hot = this.hot;
    devServerConfig.inline = this.hot;
    devServerConfig.quiet = false;
    devServerConfig.noInfo = false;
    devServerConfig.stats = { colors: true };
    devServerConfig.contentBase = webpackOpts.output.path;


    if (devServerConfig.proxy && this.proxy) {
      var hostPortRegexp = new RegExp("^(.*:)//([A-Za-z0-9\-\.]+)(:[0-9]+)?(.*)$");
      var serverHostName = `http://${this.serverHost}:${this.serverPort}`;
      var proxyOrgHostName;
      Object.keys(devServerConfig.proxy).forEach((key) => {
        proxyOrgHostName = devServerConfig.proxy[key].replace(hostPortRegexp, serverHostName);
        devServerConfig.proxy[key] = devServerConfig.proxy[key].replace(hostPortRegexp, serverHostName);
      });

      // if you're using proxy and webpack.DefinePlugin. Chances are you have a
      // variable for the location of your api backend. This replaces the
      // backend API root to that of the proxy by searching all properties that
      // are equal to the proxy target.
      if (proxyOrgHostName) {
        webpackOpts.plugins.forEach((plugin) => {
          Object.keys(plugin).forEach((key) => {
            // signals DefinePlugin
            if (key === 'definitions') {
              var definitions = plugin[key];
              Object.keys(definitions).forEach((propKey) => {
                // find URI constants
                var defineConst = plugin[key][propKey].replace(/['"]+/g, '');
                var urlConst = defineConst.replace(hostPortRegexp, '$2$3');

                // assume constant vars with same hostname+port of proxy target reference the same resource.
                if (urlConst === proxyOrgHostName.replace(hostPortRegexp, '$2$3')) {
                  var protocol = 'http' + (devServerConfig.https ? 's' : '');
                  var newUrlConst = plugin[key][propKey].replace(hostPortRegexp, `"${protocol}://localhost:${this.port}$4`);
                  plugin[key][propKey] = newUrlConst;
                }
              });
            }
          });
        });
      }
    }

    new WebpackDevServer(webpack(webpackOpts), devServerConfig)
      .listen(this.port, () => {
        console.log(chalk.green('Webpack-dev-server'), `running at https://localhost:${this.port}`, this.hot ? chalk.magenta('in hot mode'): '');
        Object.keys(devServerConfig.proxy).forEach((proxyPath) => {
          console.log(chalk.green('Proxy ' + proxyPath + ' server'), `running at https://localhost:${this.port}` + proxyPath);
        });
      });
  }
}

export = ClientRunner;
