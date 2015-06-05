import os = require('os');

class Network {
  static getLanIp () {
    return os.networkInterfaces().en0[1].address;
  }
}

export = Network;
