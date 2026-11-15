const test = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')

// The QML tests (tests/qml) run over stand-ins for Omarchy's qs.Ui and
// qs.Commons and for Quickshell. Each stand-in may only declare names the real
// one has, or the tests would pass against an API the shell does not offer.
const stubs = path.join(__dirname, 'qml', 'stubs')
const shell = process.env.OMARCHY_SHELL || '/usr/share/omarchy/shell'
const qmltypes = '/usr/lib/qt6/qml/Quickshell'
const mprisTypes = path.join(qmltypes, 'Services', 'Mpris', 'quickshell-service-mpris.qmltypes')

// Names a component declares at its top level (two-space indent), comments
// left out: what users of the component can set, call or connect to.
function declared(source) {
  const code = source.replace(/\/\/.*$/gm, '')
  const names = new Set()
  const patterns = [
    /^ {2}(?:required |readonly |default )*property\s+[\w.<>]+\s+(\w+)/gm,
    /^ {2}(?:default )?property alias\s+(\w+)/gm,
    /^ {2}signal\s+(\w+)/gm,
    /^ {2}function\s+(\w+)/gm
  ]
  for (const pattern of patterns) for (const match of code.matchAll(pattern)) names.add(match[1])
  return names
}

function qmlFiles(dir) {
  return fs.readdirSync(dir).filter((file) => file.endsWith('.qml'))
}

for (const module of ['Ui', 'Commons']) {
  test(`os substitutos de qs.${module} só declaram o que o Omarchy tem`, (t) => {
    const realDir = path.join(shell, module)
    if (!fs.existsSync(realDir)) return t.skip(`Omarchy não encontrado em ${shell}`)
    for (const file of qmlFiles(path.join(stubs, 'qs', module))) {
      const real = path.join(realDir, file)
      assert.ok(fs.existsSync(real), `${module}/${file} não existe no Omarchy`)
      const realNames = declared(fs.readFileSync(real, 'utf8'))
      for (const name of declared(fs.readFileSync(path.join(stubs, 'qs', module, file), 'utf8'))) {
        assert.ok(realNames.has(name), `${module}/${file}: ${name} não existe no Omarchy`)
      }
    }
  })
}

test('os substitutos do Quickshell só usam o que ele tem', (t) => {
  if (!fs.existsSync(qmltypes)) return t.skip(`Quickshell não encontrado em ${qmltypes}`)
  const core = fs.readdirSync(qmltypes).filter((f) => f.endsWith('.qmltypes'))
    .map((f) => fs.readFileSync(path.join(qmltypes, f), 'utf8')).join('\n')
  const mpris = fs.readFileSync(mprisTypes, 'utf8')
  assert.match(core, /name: "execDetached"/)
  assert.match(mpris, /name: "players"/)
})

// The fake player stands for Quickshell's MprisPlayer: same names, or the
// tests would drive properties the real player does not have.
test('o FakePlayer só tem propriedades e métodos do MprisPlayer', (t) => {
  if (!fs.existsSync(mprisTypes)) return t.skip('Quickshell Mpris não encontrado')
  const mpris = fs.readFileSync(mprisTypes, 'utf8')
  const fake = fs.readFileSync(path.join(__dirname, 'qml', 'FakePlayer.qml'), 'utf8')
  const counters = new Set(['nextCalls', 'previousCalls', 'raiseCalls'])
  for (const name of declared(fake)) {
    if (counters.has(name)) continue
    assert.match(mpris, new RegExp(`name: "${name}"`), `MprisPlayer não tem ${name}`)
  }
})

// A third-party widget does not get Bar.qml as `bar` but Ui/PluginBarApi.qml
// (Bar.qml's pluginBarApiFor), a narrower API; the fake must not offer more.
// shownTooltip is the fake's own record of what the bar would show.
test('o FakeBar só tem o que o PluginBarApi do Omarchy tem', (t) => {
  const real = path.join(shell, 'Ui', 'PluginBarApi.qml')
  if (!fs.existsSync(real)) return t.skip(`Omarchy não encontrado em ${shell}`)
  const realNames = declared(fs.readFileSync(real, 'utf8'))
  const ownRecords = new Set(['shownTooltip'])
  for (const name of declared(fs.readFileSync(path.join(__dirname, 'qml', 'FakeBar.qml'), 'utf8'))) {
    if (ownRecords.has(name)) continue
    assert.ok(realNames.has(name), `PluginBarApi.qml não tem ${name}`)
  }
})