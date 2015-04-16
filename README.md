IonDrive-Cli
=========

The Ion Drive cli combines utilities common to Ion Drive dev team.

Use the `iondrive --help` command for more detailed task information.

## Installing

```bash
$ npm install -g iondrive
```

## Backups

Back up any directory by creating a tar.gz stream and piping directly to AWS S3 storage. Backups require AWS credentials managed as per [AWS node configuration guide.](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html)

Suggested configuration on development machines is to create an aws configuration file with client profiles. For servers environment variables are preferred.

### Invocation

```bash
$ iondrive backup <dir> <bucket>
```

__Command-line flags/options:__

    <dir>  ................ Target directory to backup.
    <bucket>  ............. S3 bucket name (ensure PUT authorization)
    [--prefix|-p]  ........ Prefix for the S3 file name. (Use quotes)

__Examples with AWS credentials:__
```bash
$ AWS_ACCESS_KEY_ID="someid" AWS_SECRET_ACCESS_KEY="somekey" iondrive backup ./dev mybucket
$ AWS_PROFILE="s3-iondrive" iondrive backup ./dev mybucket
$ iondrive backup ./dev mybucket
```
