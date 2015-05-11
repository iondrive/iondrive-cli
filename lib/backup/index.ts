import program = require('commander');
import DirectoryBackup = require("./directory-backup");

program
  .command('backup <dir> <bucket>')
  .description('Backup directory to S3. Requires AWS credentials http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html')
  .option("-p, --prefix [outputPrefix]", 'set output file name prefix. defaults to backup')
  .action(function(dir, bucket, options) {
    new DirectoryBackup(dir, bucket, options)
      .execute();
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ AWS_ACCESS_KEY_ID="someid" AWS_SECRET_ACCESS_KEY="somekey" iondrive backup ./dev mybucket');
    console.log('    $ AWS_PROFILE="s3-iondrive" iondrive backup ./dev mybucket');
    console.log('    $ iondrive backup ./dev mybucket');
    console.log();
  });
