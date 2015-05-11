import fs = require('fs');
import path = require('path');
import ServerRunner = require('./server-runner');
import SpaRunner = require('./spa-runner');

interface IRunnerOpts {
  hot: boolean
}

class Runner {

  private cwd: string;
  private opts: IRunnerOpts = { hot: false };
  private serverRunner: ServerRunner;
  private spaRunner: SpaRunner;
  private packageJson: any;

  constructor(cwd: string, opts: IRunnerOpts) {
    this.opts = opts || this.opts;
    this.cwd = cwd;
    this.packageJson = require(path.join(this.cwd, 'package'));

    if (this.isServer()) {
      this.serverRunner = new ServerRunner(this.cwd);
    } else if (this.isApp()) {
      this.serverRunner = new ServerRunner(this.findProjectByType('server'));
      this.spaRunner = new SpaRunner(this.cwd, this.serverRunner, opts);
    }
  }

  public start() {
    this.serverRunner.start();
    if (this.spaRunner) this.spaRunner.start();
  }

  private isServer() {
    return this.packageJson.name.indexOf('-server') > -1;
  }

  private isApp() {
    return this.packageJson.name.indexOf('-app') > -1;
  }

  private splitPath (path) {
    var parts = path.split(/(\/|\\)/);
    if (!parts.length) return parts;
    return !parts[0].length ? parts.slice(1) : parts;
  }

  private testDir(parts, projectType) {
    if (parts.length === 0) return null;
    var p = parts.join('');
    var itdoes = fs.existsSync(path.join(p, projectType));
    return itdoes ? p : this.testDir(parts.slice(0, -1), projectType);
  }

  private findProjectByType(projectType: string) {
    var moduleName = this.packageJson.name.split('-')[0] + '-' + projectType;
    return path.join(this.testDir(this.splitPath(this.cwd), moduleName), moduleName);
  }


}

export = Runner;
