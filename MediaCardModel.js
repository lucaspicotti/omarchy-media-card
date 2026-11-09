.pragma library

// Pure logic for the media card plugin. No QML types, no I/O: everything here
// is tested with node:test (see tests/).

function formatTime(value) {
  var seconds = Number(value)
  seconds = isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  var hours = Math.floor(seconds / 3600)
  var minutes = Math.floor(seconds % 3600 / 60)
  var tail = ":" + twoDigits(seconds % 60)
  if (hours > 0) return hours + ":" + twoDigits(minutes) + tail
  return minutes + tail
}

function twoDigits(number) {
  return (number < 10 ? "0" : "") + number
}

function progressFraction(position, length) {
  var total = Number(length)
  var current = Number(position)
  if (!isFinite(total) || total <= 0 || !isFinite(current)) return 0
  return Math.min(1, Math.max(0, current / total))
}

function limitText(text, max) {
  var value = text === null || text === undefined ? "" : String(text)
  var chars = Array.from(value)
  if (chars.length <= max) return value
  return chars.slice(0, max - 1).join("").replace(/\s+$/, "") + "…"
}

// A: text only, B: cover and transport controls, C: cover with a progress line.
var BAR_STYLES = ["minimal", "controls", "icon"]

var DEFAULT_SETTINGS = {
  barStyle: "icon",
  showVolume: false,
  showOthers: true,
  hideWhenIdle: true
}

function isValidSetting(key, value) {
  if (key === "barStyle") return BAR_STYLES.indexOf(value) !== -1
  return typeof value === "boolean"
}

function settingsFrom(raw) {
  var result = {}
  for (var key in DEFAULT_SETTINGS) {
    var value = raw ? raw[key] : undefined
    result[key] = isValidSetting(key, value) ? value : DEFAULT_SETTINGS[key]
  }
  return result
}

function widgetVisible(hasMedia, settings) {
  return !!hasMedia || !settingsFrom(settings).hideWhenIdle
}

function playerLabel(player) {
  if (!player) return ""
  if (player.identity) return player.identity
  return capitalize(player.desktopEntry || dbusPlayerName(player.dbusName))
}

// "org.mpris.MediaPlayer2.chromium.instance4821" -> "chromium"
function dbusPlayerName(dbusName) {
  return String(dbusName || "")
    .replace(/^org\.mpris\.MediaPlayer2\./, "")
    .replace(/\.instance[0-9]+$/, "")
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function playerState(player) {
  if (!player) return ""
  return player.isPlaying ? "playing" : "paused"
}

function tabsFor(players, selectedKey) {
  var list = toArray(players)
  if (list.length < 2) return []
  var shownKey = shownPlayerKey(list, selectedKey)
  return list.map(function(player) {
    var key = playerKey(player)
    return { key: key, label: playerLabel(player), selected: key === shownKey }
  })
}

function otherPlayers(players, selectedKey, settings) {
  if (!settingsFrom(settings).showOthers) return []
  var list = toArray(players)
  var shownKey = shownPlayerKey(list, selectedKey)
  return list
    .filter(function(player) { return playerKey(player) !== shownKey })
    .map(function(player) {
      return {
        key: playerKey(player),
        label: playerLabel(player),
        title: String(player.trackTitle || ""),
        state: playerState(player)
      }
    })
}

// The player at the top of the card: the selected one while it is in the
// list, otherwise the first.
function shownPlayerKey(list, selectedKey) {
  var found = list.some(function(player) { return playerKey(player) === selectedKey })
  return found ? selectedKey : playerKey(list[0])
}

// Same rule as MediaModel.playerKey in Omarchy's media service, so the key can
// be handed to its selectPlayer().
function playerKey(player) {
  if (!player) return ""
  return String(player.dbusName || player.desktopEntry || player.identity || "")
}

// Copies a QML list (array-like, no Array methods) into a real array, skipping
// empty entries left by a player that is going away.
function toArray(list) {
  var result = []
  var length = list ? list.length || 0 : 0
  for (var i = 0; i < length; i++) {
    if (list[i]) result.push(list[i])
  }
  return result
}
