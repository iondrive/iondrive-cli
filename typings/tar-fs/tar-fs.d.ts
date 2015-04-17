/// <reference path="../node/node.d.ts" />

declare module "tar-fs" {
  interface packOpts {
    ignore?(name: string);
    entries?: Array<string>;
    dereference?: boolean;
  }

  export function pack(directory: string): NodeJS.ReadableStream;
  export function pack(directory: string, opts: packOpts): NodeJS.ReadableStream;
}
