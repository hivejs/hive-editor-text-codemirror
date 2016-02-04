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
