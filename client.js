var CodeMirror = require('codemirror')
  , bindCodemirror = require('gulf-codemirror')

module.exports = setup
module.exports.consumes = ['editor']
module.exports.provides = []
function setup(plugin, imports, register) {
  var editor = imports.editor

  var cmCssLink = document.createElement('link')
  cmCssLink.setAttribute('rel', "stylesheet")
  cmCssLink.setAttribute('href', "/static/hive-editor-text-codemirror/static/codemirror.css")
  document.head.appendChild(cmCssLink)

  editor.registerEditor('text', function*() {
    var editor = document.querySelector('#editor')
    var cm = CodeMirror(function(el) {
      editor.appendChild(el)
      
      el.style['height'] = '100%'
      el.style['width'] = '100%'
    })

    editor.style['height'] = '100%'
    document.body.style['position'] = 'absolute'
    document.body.style['bottom'] =
    document.body.style['top'] =
    document.body.style['left'] =
    document.body.style['right'] = '0'

    return bindCodemirror(cm)
  })
  register()
}
