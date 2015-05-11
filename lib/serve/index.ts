import program = require('commander');
import Runner = require('./runner');

program
  .command('serve')
  .description('Serve a menulab project. All client side projects have their server dependency booted up')
  .action(function() {
    new Runner(process.cwd()).start();
  })
  .on('--help', function() {
    console.log('  Examples:');
    console.log();
    console.log('    $ iondrive serve');
    console.log();
  });
