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
  var value = toText(text)
  // UTF-16 length is never below the code-point count, so this skips the copy.
  if (value.length <= max) return value
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

// Settings that take one of a fixed list; every other setting is valid when it
// has the same type as its default.
var SETTING_OPTIONS = { barStyle: BAR_STYLES }

function isValidSetting(key, value) {
  var options = SETTING_OPTIONS[key]
  if (options) return options.indexOf(value) !== -1
  return typeof value === typeof DEFAULT_SETTINGS[key]
}

function settingsFrom(raw) {
  var result = {}
  for (var key in DEFAULT_SETTINGS) {
    var value = raw ? raw[key] : undefined
    result[key] = isValidSetting(key, value) ? value : DEFAULT_SETTINGS[key]
  }
  return result
}

// Takes the already normalized hideWhenIdle (see settingsFrom).
function widgetVisible(hasMedia, hideWhenIdle) {
  return !!hasMedia || !hideWhenIdle
}

// What each bar style draws. A: status icon and text. B: cover, title and
// previous/play/next. C: cover, play/pause and a progress line.
function barParts(style) {
  return {
    statusIcon: style === "minimal",
    cover: style !== "minimal",
    skip: style === "controls",
    playPause: style !== "minimal",
    progress: style === "icon"
  }
}

// The text beside the controls: "artist — title" for A, the title for B.
function barText(style, track) {
  if (style === "minimal") return limitText(trackLine(track.artist, track.title), 28)
  if (style === "controls") return limitText(track.title, 24)
  return ""
}

// Joins the parts that are not empty with an em dash.
function trackLine(first, second) {
  return [toText(first), toText(second)].filter(function(part) { return part !== "" }).join(" — ")
}

// The active player's track, with every field already safe to show.
function nowPlaying(player) {
  var p = player || {}
  return {
    hasMedia: hasTrack(player),
    title: toText(p.trackTitle),
    artist: toText(p.trackArtist),
    artUrl: safeArtUrl(p.trackArtUrl)
  }
}

function playerLabel(player) {
  if (!player) return ""
  if (player.identity) return player.identity
  return capitalize(player.desktopEntry || dbusPlayerName(player.dbusName))
}

// "org.mpris.MediaPlayer2.chromium.instance4821" -> "chromium". Same
// patterns as MediaModel.playerAppLabel in Omarchy's media service.
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

// Takes the already normalized showOthers (see settingsFrom).
function otherPlayers(players, selectedKey, showOthers) {
  if (!showOthers) return []
  var list = toArray(players)
  var shownKey = shownPlayerKey(list, selectedKey)
  var result = []
  list.forEach(function(player) {
    var key = playerKey(player)
    if (key === shownKey) return
    result.push({ key: key, label: playerLabel(player), title: toText(player.trackTitle), state: playerState(player) })
  })
  return result
}

// Indexed by Quickshell's MprisLoopState enum: None, Track, Playlist.
var REPEAT_MODES = ["none", "track", "playlist"]

function controlsFor(value) {
  var player = value || {}
  return {
    enabled: {
      previous: !!player.canGoPrevious,
      playPause: !!(player.canTogglePlaying || player.canPlay || player.canPause),
      next: !!player.canGoNext,
      shuffle: !!player.shuffleSupported,
      repeat: !!player.loopSupported,
      raise: !!player.canRaise
    },
    playing: !!player.isPlaying,
    shuffleOn: !!player.shuffle,
    repeatMode: REPEAT_MODES[player.loopState] || "none"
  }
}

// The MprisPlayer method play/pause calls, or "" when the player cannot.
// Same order as Omarchy's media service: toggle, else pause or play.
function playPauseMethod(player) {
  if (!player) return ""
  if (player.canTogglePlaying) return "togglePlaying"
  if (player.isPlaying) return player.canPause ? "pause" : ""
  return player.canPlay ? "play" : ""
}

// Cover addresses come from whichever program registered as a player. Only
// https covers and files a browser saved to disk are loaded; no whitespace or
// control characters, and nothing long enough to be a payload.
var MAX_ART_URL_LENGTH = 2048
var SAFE_ART_URL = /^(https|file):\/\/[^\s\x00-\x1f\x7f]+$/i

function safeArtUrl(url) {
  var text = toText(url)
  if (text.length > MAX_ART_URL_LENGTH) return ""
  return SAFE_ART_URL.test(text) ? text : ""
}

function toText(value) {
  return value === null || value === undefined ? "" : String(value)
}

// Third-party plugins cannot reach Omarchy's own media service, so the plugin
// picks the player itself, in order: the one chosen in a tab while it still
// has a track, the one playing, the first with a track, none.
function activePlayer(players, preferredKey) {
  var list = toArray(players)
  return firstWhere(list, function(p) { return playerKey(p) === preferredKey && hasTrack(p) })
    || firstWhere(list, function(p) { return p.isPlaying })
    || firstWhere(list, hasTrack)
}

// Same rule as MediaModel.hasShownTrack in Omarchy's media service.
function hasTrack(player) {
  return !!player && !!(player.trackTitle || player.trackArtist)
}

function firstWhere(list, predicate) {
  for (var i = 0; i < list.length; i++) {
    if (predicate(list[i])) return list[i]
  }
  return null
}

// The player at the top of the card: the selected one while it is in the
// list, otherwise the first.
function shownPlayerKey(list, selectedKey) {
  var found = list.some(function(player) { return playerKey(player) === selectedKey })
  return found ? selectedKey : playerKey(list[0])
}

// Stable key per player, also used as the bar's preferredKey. Same rule as
// MediaModel.playerKey in Omarchy's media service.
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
