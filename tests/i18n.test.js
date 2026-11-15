const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const { loadQmlJs } = require('./load-qml-js.js')
const { readQml } = require('./qml-source.js')

const Model = loadQmlJs('MediaCardModel.js')
const dir = path.join(__dirname, '..', 'i18n')
const catalog = (code) => JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), 'utf8'))

// Keys written in the QML, plus every key the model can hand it.
function usedKeys() {
  const keys = []
  for (const file of ['BarWidget.qml', 'MediaCard.qml']) {
    for (const match of readQml(file).matchAll(/strings\.t\("([^"]+)"\)/g)) keys.push(match[1])
  }
  for (const isPlaying of [true, false]) {
    for (const loopState of [0, 1, 2]) {
      const controls = Model.controlsFor({ isPlaying, loopState })
      keys.push(controls.playPauseLabel, controls.repeatLabel)
    }
    const others = Model.otherPlayers([{ identity: 'a' }, { identity: 'b', isPlaying }], 'a', true)
    keys.push(others[0].stateLabel)
  }
  for (const style of Model.BAR_STYLES) {
    const labels = Model.barStyleLabels(style)
    keys.push(labels.label, labels.description)
  }
  return keys
}

test('toda chave que o widget, o card e o modelo pedem existe em inglês', () => {
  const en = catalog('en')
  const keys = usedKeys()
  assert.ok(keys.length > 0)
  for (const key of keys) assert.ok(key in en, `chave: ${key}`)
})

test('o português tem as mesmas chaves do inglês', () => {
  assert.deepStrictEqual(Object.keys(catalog('pt-BR')).sort(), Object.keys(catalog('en')).sort())
})
