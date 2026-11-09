const test = require('node:test')
const assert = require('node:assert')
const { loadQmlJs } = require('./load-qml-js.js')

const Model = loadQmlJs('MediaCardModel.js')

// The cover address comes from whichever program registered as a player, so
// it is untrusted input.
test('safeArtUrl mantém capas https', () => {
  const url = 'https://i.scdn.co/image/ab67616d0000b273abc123'
  assert.strictEqual(Model.safeArtUrl(url), url)
})

// Browsers save the cover to disk and hand over a file:// address.
test('safeArtUrl mantém capas locais file://', () => {
  const url = 'file:///tmp/.org.chromium.Chromium.abc123'
  assert.strictEqual(Model.safeArtUrl(url), url)
})

test('safeArtUrl aceita o esquema em maiúsculas', () => {
  assert.strictEqual(Model.safeArtUrl('HTTPS://i.scdn.co/image/x'), 'HTTPS://i.scdn.co/image/x')
  assert.strictEqual(Model.safeArtUrl('File:///tmp/cover.png'), 'File:///tmp/cover.png')
})

test('safeArtUrl recusa endereços com espaço ou caracteres de controle', () => {
  const rejected = [
    'https://i.scdn.co/image/x\njavascript:alert(1)',
    'https://i.scdn.co/image/x\u0000',
    'https://i.scdn.co/image /x',
    'file:///tmp/cover\t.png',
    'https://i.scdn.co/image/x\u007f'
  ]
  for (const url of rejected) {
    assert.strictEqual(Model.safeArtUrl(url), '', `url: ${JSON.stringify(url)}`)
  }
})

test('safeArtUrl recusa endereços com mais de 2048 caracteres', () => {
  const prefix = 'https://i.scdn.co/image/'
  const atLimit = prefix + 'a'.repeat(2048 - prefix.length)
  assert.strictEqual(Model.safeArtUrl(atLimit), atLimit)
  assert.strictEqual(Model.safeArtUrl(atLimit + 'a'), '')
})

// QML can hand over a url-typed value instead of a string.
test('safeArtUrl sempre devolve texto, mesmo recebendo um objeto de url', () => {
  const urlObject = { toString: () => 'https://i.scdn.co/image/x' }
  assert.strictEqual(Model.safeArtUrl(urlObject), 'https://i.scdn.co/image/x')
})

test('safeArtUrl devolve texto vazio para entrada vazia ou ausente', () => {
  for (const url of ['', null, undefined]) {
    assert.strictEqual(Model.safeArtUrl(url), '', `url: ${url}`)
  }
})

test('safeArtUrl recusa qualquer esquema que não seja https ou file', () => {
  const rejected = [
    'http://example.com/cover.jpg',
    'javascript:alert(1)',
    'data:image/png;base64,iVBORw0KGgo=',
    'ftp://example.com/cover.jpg',
    'qrc:/cover.png',
    '/home/user/cover.jpg',
    'cover.jpg'
  ]
  for (const url of rejected) {
    assert.strictEqual(Model.safeArtUrl(url), '', `url: ${url}`)
  }
})
