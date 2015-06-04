IonDrive-Cli
=========

The IonDrive cli combines utilities common to IonDrive dev team.

Use the `iondrive --help` command for more detailed task information.

## Installing

```bash
$ npm install -g iondrive
```

## Development

You know it's best practice to split your project into separate server and client repositories. This however complicates how your project is booted up for development purposes.

Our serve tool aims to boot up a client project along with any server side dependencies with one cli command.

### serve

Ion Drive cli `serve` presumes you have a repository for your server and client side code. When your terminals current working directory (cwd) is that of the client, the ion drive `serve` command will boot up any server dependencies located as a sibling to that of the client project. e.g.

```bash
cd mynewproject
ls
mynewproject-server
mynewproject-app

```
The cli is convention based and will pickup client and server dependencies based on the package json names conforming to the following convention:

* server
  - appname-{server|api|backend}
  - e.g. mynewproject-server

* client
  - appname-{app|client|spa}
  - e.g. mynewproject-app

Invocation:

```bash  
cd mynewproject-app
iondrive serve

```

__Command-line flags/options:__

    [platform]  ........ run against 'ios' or 'android' emulator.
    [--hot|-h]  ........ Live reload of front end assets.
    [--no-proxy|-np]  .. Don't overwrite dev server proxy targets.

#### Platforms ios and android

Running serve with a platform argument of `ios` or 'android', assumes you have `ionic-cli` installed as global.
Serve [platform] compiles webpack assets and sets any URI constants defined in the DefinePlugin to that of the backend server.

Running with argument hot, uses the webpack-dev-server to host assets, allowing for live reloading.

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
