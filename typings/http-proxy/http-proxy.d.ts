/// <reference path="../node/node.d.ts" />

declare module "http-proxy" {
  import http = require("http");
  import https = require("https");

  interface IServerConfig {
    host: string,
    port: string
  }

  interface IServerOpts {
    target: IServerConfig,
    ssl?: https.ServerOptions
  }

  export function createServer(IServerOpts): http.Server;
}
