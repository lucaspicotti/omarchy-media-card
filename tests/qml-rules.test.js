const test = require('node:test')
const assert = require('node:assert')
const { readQml, block, blocks } = require('./qml-source.js')

// Rules the QML tests (tests/qml) cannot check by clicking: they hold for
// every Text and every command, not only the ones a test reaches.
const files = ['BarWidget.qml', 'MediaCard.qml']
const sources = Object.fromEntries(files.map((file) => [file, readQml(file)]))

// Titles, artists and player names come from whichever program registered as
// a player: an AutoText sink would render markup such as <img src=...>.
test('todo Text do widget e do card é texto puro', () => {
  for (const [file, source] of Object.entries(sources)) {
    const texts = blocks(source, 'Text {')
    assert.ok(texts.length > 0, file)
    for (const text of texts) assert.match(text, /textFormat: Text\.PlainText/, `${file}: ${text.split('\n')[0]}`)
  }
})

test('o widget e o card não rodam nada por um shell, só o argv que o modelo monta', () => {
  for (const [file, source] of Object.entries(sources)) {
    assert.doesNotMatch(source, /bash|sh -c|bar\.run\(/, file)
    for (const call of source.match(/execDetached\([^)]*\)/g) || []) {
      assert.strictEqual(call, 'execDetached(argv)', `${file}: ${call}`)
    }
  }
  assert.match(sources['MediaCard.qml'], /card\.run\(Model\.copyCommand\(/)
  assert.match(block(sources['MediaCard.qml'], 'function save('), /run\(Model\.settingCommand\(key, value\)\)/)
})

// With hideWhenIdle off a click reaches toggleCard() even without media; the
// card must still stay closed then.
test('o card só abre com mídia tocando', () => {
  assert.match(block(sources['BarWidget.qml'], 'MediaCard {'), /open: root\.cardOpen && root\.hasMedia/)
})

test('o Timer da posição roda com a linha de progresso ou o card na tela e o player tocando', () => {
  const timer = block(sources['BarWidget.qml'], 'Timer {')
  assert.match(timer, /running: \(progressLine\.visible \|\| root\.cardOpen\) && root\.controls\.playing\s*\n/)
})
