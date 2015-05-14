var program = require('commander');
program
    .version(require('./package').version)
    .action(function () {
    program.outputHelp();
});
require('./lib/backup');
require('./lib/serve');
program.parse(process.argv);
// handle no command
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
