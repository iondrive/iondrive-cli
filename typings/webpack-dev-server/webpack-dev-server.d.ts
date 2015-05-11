/// <reference path="../node/node.d.ts" />

declare module "webpack-dev-server" {

  class WebPackDevServer {
    constructor(webpackConfig: any, devServerConfig: any);
    listen(port: number, callback?: () => void);
  }

  export = WebPackDevServer;
}
