var CodeMirror = require('codemirror')
  , bindCodemirror = require('gulf-codemirror')
  , vdom = require('virtual-dom')
  , h = vdom.h

const SET_MODE = 'EDITORTEXTCODEMIRROR_SET_MODE'
const TOGGLE_LINENUMBERS = 'EDITORTEXTCODEMIRROR_TOGGLE_LINENUMBERS'

module.exports = setup
module.exports.consumes = ['ui', 'editor']
module.exports.provides = []
function setup(plugin, imports, register) {
  var ui = imports.ui
    , editor = imports.editor

  ui.reduxReducerMap.editorTextCodemirror = reducer
  function reducer(state, action) {
    if(!state) return {mode: null, lineNumbers: false}
    if(SET_MODE === action.type) {
      return {...state, mode: action.payload}
    }
    if(TOGGLE_LINENUMBERS === action.type) {
      return {...state, lineNumbers: !state.lineNumbers}
    }
    return state
  }

  editor.registerEditor('CodeMirror', 'text', 'An extensible and performant code editor'
  , function(editorEl) {
    var cm = CodeMirror(function(el) {
      editorEl.appendChild(el)

      el.style['height'] = '100%'
      el.style['width'] = '100%'
    }, ui.store.getState().editorTextCodemirror)

    editorEl.style['height'] = '100%'

    var tree = render(ui.store, ui.config)
      , root = vdom.create(tree)
    editorEl.appendChild(root)

    ui.store.subscribe(_ => {
      var state = ui.store.getState()

      // update controls
      var newtree = render(ui.store, ui.config)
      vdom.patch(root, vdom.diff(tree, newtree))

      if(cm.getOption('mode') != state.editorTextCodemirror.mode) {
        cm.setOption('mode', state.editorTextCodemirror.mode)
      }
      if(cm.getOption('lineNumbers') != state.editorTextCodemirror.lineNumbers) {
        cm.setOption('lineNumbers', state.editorTextCodemirror.lineNumbers)
      }
    })

    return Promise.resolve(bindCodemirror(cm))
  })
  register()
}

function action_toggleLinenumbers() {
  return {type: TOGGLE_LINENUMBERS}
}

function action_setMode(mode) {
  return {type: SET_MODE, payload: mode}
}

function render(store, config) {
  var state = store.getState().editorTextCodemirror
  return h('div.EditorTextCodemirror__controls', [
    h('a.EditorTextCodemirror__controls__toggleLinenumbers'
    , { href: 'javascript:void(0)'
      , 'ev-click': evt => store.dispatch(action_toggleLinenumbers())
      }
    , state.lineNumbers? 'Line numbers on' : 'line numbers off')
  , ' '
  , h('select.EditorTextCodemirror__controls__selectMode'
    , { 'ev-change': evt => store.dispatch(action_setMode(evt.currentTarget.value))
      }
    , [h('option', {value: ''}, 'Select a language')]
      .concat(config.editorTextCodemirror.modes.map(mode => {
        return h('option'
        , {value: mode, attributes: state.mode == mode? {selected: true} : {}}
        , mode)
      }))
    )
  ])
}
