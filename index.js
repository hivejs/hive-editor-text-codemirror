var path = require('path')
  , textOT = require('ot-text').type

module.exports = setup
module.exports.consumes = ['assets', 'ot']

function setup(plugin, imports, register) {
  var assets = imports.assets
  var ot = imports.ot

  assets.registerModule(path.join(__dirname, 'client.js'))
  assets.registerStylesheet(path.join(__dirname, 'static/codemirror.css'))

  ot.registerOTType('text', textOT)

  register()
}
