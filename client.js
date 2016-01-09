var CodeMirror = require('codemirror')
  , bindCodemirror = require('gulf-codemirror')
  , vdom = require('virtual-dom')
  , h = vdom.h

const SET_MODE = 'EDITORTEXTCODEMIRROR_SET_MODE'
const TOGGLE_LINENUMBERS = 'EDITORTEXTCODEMIRROR_TOGGLE_LINENUMBERS'
const SET_LINENUMBERS = 'EDITORTEXTCODEMIRROR_SET_LINENUMBERS'

module.exports = setup
module.exports.consumes = ['ui', 'editor', 'settings']
module.exports.provides = []
function setup(plugin, imports, register) {
  var ui = imports.ui
    , editor = imports.editor
    , settings = imports.settings

  ui.reduxReducerMap.editorTextCodemirror = reducer
  function reducer(state, action) {
    if(!state) return {mode: null, lineNumbers: false}
    if(SET_MODE === action.type) {
      return {...state, mode: action.payload}
    }
    if(TOGGLE_LINENUMBERS === action.type) {
      return {...state, lineNumbers: !state.lineNumbers}
    }
    if(SET_LINENUMBERS === action.type) {
      return {...state, lineNumbers: action.payload}
    }
    return state
  }

  editor.registerEditor('CodeMirror', 'text', 'An extensible and performant code editor'
  , function(editorEl) {
    // Overtake settings
    setImmediate(function() {
      ui.store.dispatch(action_setLinenumbers(
        settings.getForUserDocument('editorTextCodemirror:lineNumbers')
      || settings.getForDocument('editorTextCodemirror:lineNumbers')
      ))

      ui.store.dispatch(action_setMode(
        settings.getForUserDocument('editorTextCodemirror:mode')
      || settings.getForDocument('editorTextCodemirror:mode')
      ))
    })

    var cmEl
    var cm = CodeMirror(function(el) {
      editorEl.appendChild(el)
      el.style['height'] = '100%'
      cmEl = el
    }, ui.store.getState().editorTextCodemirror)

    editorEl.style['height'] = '100%'

    var tree = render(ui.store, ui.config)
      , root = vdom.create(tree)
    cmEl.appendChild(root)

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


  // Document Settings

  settings.onRenderDocumentSettings((children) => {
    if(ui.store.getState().editor.document.type !== 'text') return

    children.push(
      renderlineNumberSetting(settings.getForDocument('editorTextCodemirror:lineNumbers')
      , evt => {
          ui.store.dispatch(settings.action_setForDocument({
            'editorTextCodemirror:lineNumbers': evt.currentTarget.checked
          }))
        }
      )
    )
    children.push(
      renderModeSetting(settings.getForDocument('editorTextCodemirror:mode')
      , evt => {
          ui.store.dispatch(settings.action_setForDocument({
            'editorTextCodemirror:mode': evt.currentTarget.value
          }))
        }
      )
    )
  })

  settings.onRenderUserDocumentSettings((children) => {
    if(ui.store.getState().editor.document.type !== 'text') return

    children.push(
      renderlineNumberSetting(settings.getForUserDocument('editorTextCodemirror:lineNumbers')
      , evt => {
          ui.store.dispatch(settings.action_setForUserDocument({
            'editorTextCodemirror:lineNumbers': evt.currentTarget.checked
          }))
        }
      )
    )
    children.push(
      renderModeSetting(settings.getForUserDocument('editorTextCodemirror:mode')
      , evt => {
          ui.store.dispatch(settings.action_setForUserDocument({
            'editorTextCodemirror:mode': evt.currentTarget.value
          }))
        }
      )
    )
  })

  function renderlineNumberSetting(checked, cb) {
    return h('li.list-group-item', [
      h('input', {
        type: 'checkbox'
      , 'ev-change': cb
      , checked
      })
    , 'Show line numbers'
    ])
  }

  function renderModeSetting(currentMode, cb) {
    return h('li.list-group-item', [
      'Syntax highlighting '
    , h('select'
      , { 'ev-change': cb, value: currentMode }
      , [h('option', {value: ''}, 'Select a language')]
        .concat(ui.config.editorTextCodemirror.modes.map(mode => {
          return h('option'
          , {value: mode, attributes: currentMode == mode? {selected: true} : {}}
          , mode)
        }))
      )
    ])
  }

  register()
}

function action_setLinenumbers(value) {
  return {type: SET_LINENUMBERS, payload: value}
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
