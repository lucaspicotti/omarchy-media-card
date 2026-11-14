const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

const dir = path.join(__dirname, '..', 'i18n')
const catalog = (code) => JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), 'utf8'))
const card = fs.readFileSync(path.join(__dirname, '..', 'MediaCard.qml'), 'utf8')

test('toda chave que o card pede existe em inglês', () => {
  const en = catalog('en')
  const keys = [...card.matchAll(/strings\.t\("([^"]+)"/g)].map((m) => m[1])
  assert.ok(keys.length > 0)
  for (const key of keys) assert.ok(key in en, `chave: ${key}`)
})

test('o português tem as mesmas chaves do inglês', () => {
  assert.deepStrictEqual(Object.keys(catalog('pt-BR')).sort(), Object.keys(catalog('en')).sort())
})
