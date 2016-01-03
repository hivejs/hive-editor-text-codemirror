var path = require('path')
  , textOT = require('ot-text').type

module.exports = setup
module.exports.consumes = ['ui', 'ot']

function setup(plugin, imports, register) {
  var ui = imports.ui
  var ot = imports.ot

  ui.registerModule(path.join(__dirname, 'client.js'))
  ui.registerStylesheet(path.join(__dirname, 'static/codemirror.css'))

  ot.registerOTType('text', textOT)

  register()
}
