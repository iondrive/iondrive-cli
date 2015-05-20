import program = require('commander');
import Runner = require('./runner');

program
  .command('serve')
  .description('Serve a server|client project. All client side projects have their server dependency booted up')
  .option("-h, --hot", 'Hot reloads of client side code.')
  .action(function(options) {
    new Runner(process.cwd(), options).start();
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ iondrive serve');
    console.log('    $ iondrive serve --hot');
    console.log();
  });
