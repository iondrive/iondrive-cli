/// <reference path="../../typings/tsd.d.ts"/>

import path = require('path');
import fs = require('fs');
import zlib = require('zlib');
import tarfs = require('tar-fs');

import aws = require('aws-sdk');
import moment = require('moment');
import log = require('../log');

interface BackupOpts {
  prefix: string
};

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
  };

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
  };

  execute() {
    this.s3.upload({ Body: this.createReadStream() }, (err, data) => {
      if (err) return log.error(err);
      log.info({
        totalBytes: this.totalBytes,
        loadedBytes: this.loadedBytes,
        fileName: this.fileName
      }, 'complete')
    })
    .on('httpUploadProgress', (evt) => {
      this.totalBytes = evt.total;
      this.loadedBytes = evt.loaded;

      log.info({
        totalBytes: this.totalBytes,
        loadedBytes: this.loadedBytes,
        fileName: this.fileName
      }, 'progress');
    });
  }
};

export = DirectoryBackup;
