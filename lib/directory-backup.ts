/// <reference path="../typings/tsd.d.ts"/>

import zlib = require('zlib');
import tarfs = require('tar-fs');

import aws = require('aws-sdk');
import moment = require('moment');
import log = require('./log');

interface BackupOpts {
  prefix: string
};

class DirectoryBackup {
  private fileName: string;
  private totalBytes: number = 0;
  private loadedBytes: number = 0;
  private readStream: NodeJS.ReadableStream;
  private s3: aws.S3;

  constructor(directory: string, bucket: string, awsParams: BackupOpts) {
    this.fileName = (awsParams.prefix || 'backup') + '-' + moment().format() + '.tar.gz';
    this.s3 = new aws.S3({
      params: {
        Bucket: bucket,
        Key: this.fileName
      }
    });
    this.readStream = tarfs
      .pack(directory, {
        dereference: true
      })
      .pipe(zlib.createGzip())
  };

  execute() {
    this.s3.upload({ Body: this.readStream }, (err, data) => {
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
