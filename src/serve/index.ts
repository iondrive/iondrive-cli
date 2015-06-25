import program = require('commander');
import Runner = require('./runner');

program
  .command('serve [platform]')
  .description('Serve a server|client project. All client side projects have their server dependency booted up')
  .option("-h, --hot", 'Hot reloads of client side code. Default when platform is specified.')
  .option("-np, --no-proxy", "Don't override proxy paths to server hostname and port.")
  .option("-d, --device", "Target physical device.")
  .option("-a, --all", "Boot up dependencies")
  .option("-l, --lan", "Address servers by local network ip")
  .action(function(platform, options) {
    if (platform && ['ios', 'android'].indexOf(platform.toLowerCase()) > -1 ) {
      options.cordova = platform.toLowerCase();
    }
    new Runner(process.cwd(), options).start();
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ iondrive serve');
    console.log('    $ iondrive serve ios');
    console.log('    $ iondrive serve android');
    console.log('    $ iondrive serve --hot');
    console.log('    $ iondrive serve --no-proxy');
    console.log();
  });
