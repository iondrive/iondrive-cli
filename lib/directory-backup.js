/// <reference path="../typings/tsd.d.ts"/>
var zlib = require('zlib');
var tarfs = require('tar-fs');
var aws = require('aws-sdk');
var moment = require('moment');
var log = require('./log');
;
var DirectoryBackup = (function () {
    function DirectoryBackup(directory, bucket, awsParams) {
        this.totalBytes = 0;
        this.loadedBytes = 0;
        this.fileName = (awsParams.outputPrefix || 'backup') + '-' + moment().format() + '.tar.gz';
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
            .pipe(zlib.createGzip());
    }
    ;
    DirectoryBackup.prototype.execute = function () {
        var _this = this;
        this.s3.upload({ Body: this.readStream }, function (err, data) {
            if (err)
                return log.error(err);
            log.info({
                totalBytes: _this.totalBytes,
                loadedBytes: _this.loadedBytes,
                fileName: _this.fileName
            }, 'complete');
        })
            .on('httpUploadProgress', function (evt) {
            _this.totalBytes = evt.total;
            _this.loadedBytes = evt.loaded;
            log.info({
                totalBytes: _this.totalBytes,
                loadedBytes: _this.loadedBytes,
                fileName: _this.fileName
            }, 'progress');
        });
    };
    return DirectoryBackup;
})();
;
module.exports = DirectoryBackup;
