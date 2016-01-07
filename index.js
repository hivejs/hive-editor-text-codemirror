var path = require('path')
  , textOT = require('ot-text').type
  , fs = require('fs')

module.exports = setup
module.exports.consumes = ['ui', 'ot']

function setup(plugin, imports, register) {
  var ui = imports.ui
  var ot = imports.ot

  ui.registerModule(path.join(__dirname, 'client.js'))
  ui.registerStylesheet(path.join(__dirname, 'static/codemirror.css'))
  ui.registerStylesheet(path.join(__dirname, 'static/index.css'))

  ot.registerOTType('text', textOT)

  fs.readdir('./node_modules/codemirror/mode', function(er, files) {
    if(er) return register(er)

    var modes = files
                .filter(function(file) {
                  return !~file.indexOf('.')
                })
    modes.forEach(function(mode) {
      ui.registerJavascript(process.cwd()+'/node_modules/codemirror/mode/'+mode+'/'+mode)
    })

    ui.registerConfigEntry('editorTextCodemirror', {
      modes: modes
    })

  })

  register()
}
