/**
 * hive.js
 * Copyright (C) 2013-2016 Marcel Klehr <mklehr@gmx.net>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the Mozilla Public License version 2
 * as published by the Mozilla Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the Mozilla Public License
 * along with this program.  If not, see <https://www.mozilla.org/en-US/MPL/2.0/>.
 */
var bindCodemirror = require('gulf-codemirror')
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
    if(!state) {
      return {
        mode: null
      , lineNumbers: false
      , lineSeparator: null
      , lineWrapping: true
      }
    }
    if(SET_MODE === action.type) {
      return {...state
      , mode: action.payload
      }
    }
    if(TOGGLE_LINENUMBERS === action.type) {
      return {...state, lineNumbers: !state.lineNumbers}
    }
    if(SET_LINENUMBERS === action.type) {
      return {...state, lineNumbers: action.payload}
    }
    return state
  }

  ui.reduxMiddleware.push(function(store) {
    return next => action => {
      if(SET_MODE === action.type) {
        var mode = action.payload
        if(mode) {
          return ui.requireScript(ui.baseURL+'/static/codemirror/mode/'+mode+'/'+mode+'.js')
          .then(() => next(action))
        }
      }
      return next(action)
    }
  })

  editor.registerEditor('CodeMirror', 'text/plain', 'An extensible and performant code editor'
  , function(editorEl, onClose) {
    return ui.requireScript(ui.baseURL+'/static/build/codemirror.js')
    .then(() => {
      window.CodeMirror = require('codemirror')
      return ui.requireScript(ui.baseURL+'/static/codemirror/mode/meta.js')
    })
    .then(() => {
      // Update state on settings changes
      var dispose = settings.onChange(updateFromSettings)
      updateFromSettings()
      
      // Update editor on state changes
      var dispose2 = ui.store.subscribe(_ => {
        var state = ui.store.getState()
        if(cm.getOption('mode') != state.editorTextCodemirror.mode) {
          cm.setOption('mode', state.editorTextCodemirror.mode)
        }
        if(cm.getOption('lineNumbers') != state.editorTextCodemirror.lineNumbers) {
          cm.setOption('lineNumbers', state.editorTextCodemirror.lineNumbers)
        }
      })

      // Initialize editor
      var cmEl
      var cm = CodeMirror(function(el) {
        editorEl.appendChild(el)
        el.style['height'] = '100%'
        el.style['visibility'] = 'hidden' // Keep hidden until init
        cmEl = el
      }, ui.store.getState().editorTextCodemirror)

      editorEl.style['height'] = '100%'

      onClose(() => {
        dispose()
        dispose2()
      })

      var doc = bindCodemirror(cm)

      doc.on('editableInitialized', () => {
        cmEl.style['visibility'] = 'visible'
      })

      return Promise.resolve(doc)
    })
  })

  function updateFromSettings() {
    ui.store.dispatch(action_setLinenumbers(
      null !== settings.getForUserDocument('editorTextCodemirror:lineNumbers')?
      settings.getForUserDocument('editorTextCodemirror:lineNumbers')
    : settings.getForDocument('editorTextCodemirror:lineNumbers')
    ))

    ui.store.dispatch(action_setMode(
      settings.getForUserDocument('editorTextCodemirror:mode')
    || settings.getForDocument('editorTextCodemirror:mode')
    ))
  }


  // Document Settings

  settings.onRenderDocumentSettings((children) => {
    if(ui.store.getState().editor.document.attributes.type !== 'text/plain') return
    children.push(renderSettings(ui.store
    , settings.getForDocument.bind(settings), settings.action_setForDocument.bind(settings)))
  })

  settings.onRenderUserDocumentSettings((children) => {
    if(ui.store.getState().editor.document.attributes.type !== 'text/plain') return
    children.push(renderSettings(ui.store
    , settings.getForUserDocument.bind(settings), settings.action_setForUserDocument.bind(settings)))
  })

  function renderSettings(store, getSetting, actionSave) {
    return h('div',[
      h('h4', 'Codemirror')
    , h('ul.list-group', [
        renderlineNumberSetting(getSetting('editorTextCodemirror:lineNumbers')
        , evt => {
            ui.store.dispatch(actionSave({
              'editorTextCodemirror:lineNumbers': evt.currentTarget.checked
            }))
          }
        )
      , renderModeSetting(getSetting('editorTextCodemirror:mode')
        , evt => {
            ui.store.dispatch(actionSave({
              'editorTextCodemirror:mode': evt.currentTarget.value
            }))
          }
        )
      ])
    ])
  }

  function renderlineNumberSetting(checked, cb) {
    return h('li.list-group-item', [
      h('label', [
        h('input', {
          type: 'checkbox'
        , 'ev-change': cb
        , checked
        })
      , ' '+ui._('editor-text-codemirror/show-line-numbers')()
      ])
    ])
  }

  function renderModeSetting(currentMode, cb) {
    return h('li.list-group-item', [
      h('label', [
        ui._('editor-text-codemirror/syntax-highlighting')()+' '
      , h('select'
        , { 'ev-change': cb, value: currentMode }
        , [h('option', {
            value: ''
          , attributes: !currentMode? {selected: true} : {}
          }, ui._('editor-text-codemirror/select-mode')())]
          .concat(CodeMirror.modeInfo.map(mode => {
            return h('option'
            , {value: mode.mode, attributes: currentMode == mode.mode? {selected: true} : {}}
            , mode.name)
          }))
        )
      ])
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
