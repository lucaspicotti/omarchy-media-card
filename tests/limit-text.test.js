const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

test('limitText mantém o texto que cabe no limite', () => {
  assert.strictEqual(Model.limitText('Maria Tambiên', 28), 'Maria Tambiên')
})

test('limitText corta com reticências e o resultado respeita o limite', () => {
  assert.strictEqual(Model.limitText('abcdefghijkl', 10), 'abcdefghi…')
})

test('limitText conta emoji como um caractere e não o parte ao meio', () => {
  assert.strictEqual(Model.limitText('🎵🎶🎸🥁', 4), '🎵🎶🎸🥁')
  assert.strictEqual(Model.limitText('ab🎵cdef', 4), 'ab🎵…')
})

test('limitText não deixa espaço antes das reticências', () => {
  assert.strictEqual(Model.limitText('Khruangbin — Maria Tambiên', 12), 'Khruangbin…')
})

test('limitText devolve texto vazio para entrada vazia ou ausente', () => {
  for (const text of ['', null, undefined]) {
    assert.strictEqual(Model.limitText(text, 10), '', `texto: ${text}`)
  }
})
