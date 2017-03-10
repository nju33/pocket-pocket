'use strict'

const path = require('path')

let config = {
  // Name of electron app
  // Will be used in production builds
  name: 'Pocket Pocket',

  // webpack-dev-server port
  port: 9080,

  // electron-packager options
  // Docs: https://simulatedgreg.gitbooks.io/electron-vue/content/docs/building_your_app.html
  building: {
    arch: 'x64',
    asar: {
      unpackDir:  'node_modules/node-notifier/**'
    },
    // asar: {
      // unpackDir: path.join(__dirname, 'app.asar/node_modules/node-notifier/**')
      // unpack: path.join(__dirname, 'app/node_modules/node-notifier/vendor/**')
    // },
    dir: path.join(__dirname, 'app'),
    icon: path.join(__dirname, 'app/icons/icon'),
    ignore: /\b(src|index\.ejs|icons)\b/,
    out: path.join(__dirname, 'builds'),
    overwrite: true,
    platform: process.env.PLATFORM_TARGET || 'all'
  }
}

config.building.name = config.name

module.exports = config
