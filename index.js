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
var path = require('path')
  , textOT = require('ot-text').type
  , fs = require('fs')

module.exports = setup
module.exports.consumes = ['ui', 'ot', 'importexport', 'orm', 'sync']

function setup(plugin, imports, register) {
  var ui = imports.ui
    , ot = imports.ot
    , importexport = imports.importexport
    , orm = imports.orm
    , sync = imports.sync

  ui.registerModule(path.join(__dirname, 'client.js'))
  ui.registerStylesheet(path.join(__dirname, 'static/codemirror.css'))
  ui.registerStaticDir(path.resolve(__dirname,'..', 'codemirror'))
  ui.registerLocaleDir(path.join(__dirname, 'locales'))
  ui.externalizeModule('codemirror')

  ot.registerOTType('text/plain', textOT)

  importexport.registerExportProvider('text/plain', 'text/plain'
  , function* (document, snapshot) {
    return snapshot.contents
  })

  importexport.registerImportProvider('text/plain', 'text/*'
  , function* (document, user, data) {
    var snapshot = yield orm.collections.snapshot
      .findOne({id: document.latestSnapshot})

    // Append data to the current contents
    var changes
    if(snapshot.contents.length)
      changes = [snapshot.contents.length, '\n'+data.toString('utf8')]
    else
      changes = [data.toString('utf8')]

    var gulfDoc = yield sync.getDocument(document.id)
    yield function(cb) {
      gulfDoc.receiveEdit(JSON.stringify({
        cs: JSON.stringify(changes)
      , parent: snapshot.id
      }), user.id, null, cb)
    }
  })

  register()
}
