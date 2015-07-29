import fs = require('fs');
import path = require('path');
import _ = require('lodash');
import chalk = require('chalk');
import glob = require('glob');

const base64Matcher = new RegExp("^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$");

class Encoder {
  private fileName: string;
  private file: any;

  constructor(filePath: string, opts: any) {
    this.fileName = path.join(process.cwd(), filePath);
    this.file = require(this.fileName);
  }

  run () {
    this.file.items.forEach(function (item) {
      Object.keys(item.data).forEach(function (key) {
        var val = item.data[key];
        var isBase64 = base64Matcher.test(val);
        var decoded = new Buffer(val, isBase64 ? 'base64' : null).toString(isBase64 ? 'utf8' : 'base64');
        item.data[key] = decoded;
      })
    });
    fs.writeFileSync(this.fileName, JSON.stringify(this.file, null, 2))
  }
}

export = Encoder;
