/// <reference path="../node/node.d.ts" />

declare module nodemon {

  interface NodemonOpts {
    script: string
  }

  interface WebPackInterface{
    (config: NodemonOpts): NodeJS.EventEmitter;
  }

  module webpack {
    export interface WebPackInterface {}
  }
}

declare module "nodemon" {
  var _tmp:nodemon.WebPackInterface;
  export = _tmp;
}
