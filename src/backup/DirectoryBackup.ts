import fs = require('fs');
import path = require('path');
import zlib = require('zlib');

import aws = require('aws-sdk');
import chalk = require('chalk');
import moment = require('moment');
import tarfs = require('tar-fs');

interface BackupOpts {
  prefix: string
}

class DirectoryBackup {
  private targetPath: string;
  private fileName: string;
  private totalBytes: number = 0;
  private loadedBytes: number = 0;
  private s3: aws.S3;

  constructor(targetPath: string, bucket: string, awsParams: BackupOpts) {
    this.targetPath = targetPath;
    this.fileName = (awsParams.prefix || 'backup') + '-' + moment().format() + '.tar.gz';
    this.s3 = new aws.S3({
      params: {
        Bucket: bucket,
        Key: this.fileName
      }
    });
  }

  createReadStream() {
    var fileName;
    if (fs.lstatSync(this.targetPath).isFile()) {
      fileName = path.basename(this.targetPath);
      this.targetPath = path.dirname(this.targetPath);
    }

    return tarfs
      .pack(this.targetPath, {
        dereference: true,
        entries: fileName && [fileName]
      })
      .pipe(zlib.createGzip())
  }

  execute() {
    this.s3.upload({ Body: this.createReadStream() }, (err) => {
      if (err) return console.log(chalk.red('Error!'), err.message);

      console.log(chalk.green('OK'), `Upload of ${this.fileName} complete. ${this.totalBytes}bytes uploaded.`);
    })
      .on('httpUploadProgress', (evt) => {
        this.totalBytes = evt.total;
        this.loadedBytes = evt.loaded;
      });
  }
};

export = DirectoryBackup;
