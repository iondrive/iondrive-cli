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
        
        if (key === 'env') {
          if (_.isObject(val)) {
            var envString = '';
            Object.keys(val).forEach(function (key) {
              envString += `export ${key}=\"${val[key]}\"\n`;
            });
            val = envString;
          }
        }

        var decoded = new Buffer(val, isBase64 ? 'base64' : null).toString(isBase64 ? 'utf8' : 'base64');

        if (key === 'env' && isBase64) {
          var envObj: any = {};
          decoded.split('\n').forEach(function (line) {
            var keyVal = line.split('=');
            if (keyVal.length > 1) {
              var key = keyVal[0].replace('export ', '');
              envObj[key] = keyVal[1].replace(/['"]+/g, '');
            }
          });
          decoded = envObj;
        }

        item.data[key] = decoded;
      })
    });
    fs.writeFileSync(this.fileName, JSON.stringify(this.file, null, 2))
  }
}

export = Encoder;
