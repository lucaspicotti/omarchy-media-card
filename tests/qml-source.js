// Helpers that read QML as text, for the rules node:test checks in the source.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')

function readQml(file) {
  return fs.readFileSync(path.join(__dirname, '..', file), 'utf8')
}

// The block that starts at `name`, up to its matching closing brace.
function block(source, name, from = 0) {
  const start = source.indexOf(name, from)
  assert.notStrictEqual(start, -1, `bloco ${name} não encontrado`)
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
  }
  return source.slice(start)
}

// Every block that starts at `name`, e.g. every `Text {`.
function blocks(source, name) {
  const result = []
  for (let at = source.indexOf(name); at !== -1; at = source.indexOf(name, at + name.length)) {
    result.push(block(source, name, at))
  }
  return result
}

module.exports = { readQml, block, blocks }
