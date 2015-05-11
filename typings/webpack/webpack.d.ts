// Type definitions for Express 4.x
// Project: http://expressjs.com
// Definitions by: Boris Yankov <https://github.com/borisyankov/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/* =================== USAGE ===================

    import express = require('express');
    var app = express();

 =============================================== */

/// <reference path="../node/node.d.ts" />


declare module webpack {
  interface IOutput {
    path: string
  }

  interface IOptions {
    output: IOutput
  }

  interface Config {
    options: IOptions
  }

  interface WebPackInterface{
    (config: any): any;
  }

  module webpack {
    export interface WebPackInterface {}
  }
}

declare module "webpack" {
  var _tmp:webpack.WebPackInterface;
  export = _tmp;
}
