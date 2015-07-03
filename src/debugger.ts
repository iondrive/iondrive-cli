import fs = require('fs');
import path = require('path');
import applescript = require('applescript');
import handlebars = require('handlebars');

var templateScript = fs.readFileSync(path.join(__dirname, '../script/safari-debugger.hbs')).toString();
var template = handlebars.compile(templateScript);

class Debugger {
  static start (deviceName: string, delay: number, callback: (err: any, res: any) => void) {
    var script = template({ deviceName: deviceName });
    if (delay == 0) {
      applescript.execString(script, callback);
    } else {
      setTimeout(() => {
        applescript.execString(script, callback);
      }, delay);
    }
  }
}

export = Debugger;
