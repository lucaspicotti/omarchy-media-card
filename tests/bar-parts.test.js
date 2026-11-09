const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs, plain } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

const TRACK = { title: 'Maria Tambiên', artist: 'Khruangbin' }

test('barParts mostra em cada estilo só as partes dele', () => {
  assert.deepStrictEqual(plain(Model.barParts('minimal')), { statusIcon: true, cover: false, skip: false, playPause: false, progress: false })
  assert.deepStrictEqual(plain(Model.barParts('controls')), { statusIcon: false, cover: true, skip: true, playPause: true, progress: false })
  assert.deepStrictEqual(plain(Model.barParts('icon')), { statusIcon: false, cover: true, skip: false, playPause: true, progress: true })
})

test('barText mostra "artista — título" no minimal e só o título no controls', () => {
  assert.strictEqual(Model.barText('minimal', TRACK), 'Khruangbin — Maria Tambiên')
  assert.strictEqual(Model.barText('controls', TRACK), 'Maria Tambiên')
  assert.strictEqual(Model.barText('icon', TRACK), '')
})

test('barText corta o texto no limite de cada estilo', () => {
  const long = { title: 'a'.repeat(40), artist: '' }
  assert.strictEqual(Array.from(Model.barText('minimal', long)).length, 28)
  assert.strictEqual(Array.from(Model.barText('controls', long)).length, 24)
})

test('trackLine junta só as partes preenchidas', () => {
  assert.strictEqual(Model.trackLine('Maria Tambiên', 'Khruangbin'), 'Maria Tambiên — Khruangbin')
  assert.strictEqual(Model.trackLine('', 'Khruangbin'), 'Khruangbin')
  assert.strictEqual(Model.trackLine('Maria Tambiên', null), 'Maria Tambiên')
  assert.strictEqual(Model.trackLine('', ''), '')
})
