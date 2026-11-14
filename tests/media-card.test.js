const test = require('node:test')
const assert = require('node:assert')
const { readQml, block, blocks } = require('./qml-source.js')

const source = readQml('MediaCard.qml')

// Titles, artists and player names come from whichever program registered as
// a player: an AutoText sink would render markup such as <img src=...>.
test('todo Text do card é texto puro', () => {
  const texts = blocks(source, 'Text {')
  assert.ok(texts.length > 0)
  for (const text of texts) assert.match(text, /textFormat: Text\.PlainText/, text.split('\n')[0])
})

test('o card não roda nada por um shell, só argv', () => {
  assert.doesNotMatch(source, /bash|sh -c|bar\.run\(/)
  for (const call of source.match(/execDetached\([^)]*\)/g) || []) {
    assert.match(call, /execDetached\(\["wl-copy", "--", /, call)
  }
})

test('as abas e o "Também tocando" usam só os players com faixa', () => {
  assert.match(source, /Model\.mediaPlayers\(card\.widget\.players\)/)
  assert.match(source, /Model\.tabsFor\(card\.players, card\.shownKey\)/)
  assert.match(source, /Model\.otherPlayers\(card\.players, card\.shownKey, true\)/)
})
