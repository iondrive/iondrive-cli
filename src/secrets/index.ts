import program = require('commander');
import Base64Encoder = require('./Base64Encoder');

program
  .command('secrets [method] [path]')
  .description('Encode or decode base64 keys in a json file')
  .action(function(method, path, options) {
    if (method && ['encode', 'decode', 'base64'].indexOf(method.toLowerCase()) > -1 ) {
      new Base64Encoder(path, options).run();
    }
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ iondrive secrets encode ./secrets.json');
    console.log('    $ iondrive secrets decode ./secrets.json');
    console.log('    $ iondrive secrets base64 ./secrets.json');
    console.log();
  });
