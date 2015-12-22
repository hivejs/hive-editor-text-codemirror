var CodeMirror = require('codemirror')
  , bindCodemirror = require('gulf-codemirror')

module.exports = setup
module.exports.consumes = ['editor']
module.exports.provides = []
function setup(plugin, imports, register) {
  var editor = imports.editor

  editor.registerEditor('CodeMirror', 'text', 'An extensible and performant code editor'
  , function*(editorEl) {
    var cm = CodeMirror(function(el) {
      editorEl.appendChild(el)

      el.style['height'] = '100%'
      el.style['width'] = '100%'
    })

    editorEl.style['height'] = '100%'
    document.body.style['position'] = 'absolute'
    document.body.style['bottom'] =
    document.body.style['top'] =
    document.body.style['left'] =
    document.body.style['right'] = '0'

    return bindCodemirror(cm)
  })
  register()
}
