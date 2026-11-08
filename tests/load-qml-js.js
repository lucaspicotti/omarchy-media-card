// Loads a QML JavaScript library (plain function declarations, no exports)
// into an isolated context so node:test can call its functions directly.
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function loadQmlJs(relativePath) {
  const file = path.join(__dirname, '..', relativePath)
  const source = fs.readFileSync(file, 'utf8').replace(/^\s*\.pragma\s+library\s*$/m, '')
  const context = vm.createContext({})
  vm.runInContext(source, context, { filename: file })
  return context
}

module.exports = { loadQmlJs }
