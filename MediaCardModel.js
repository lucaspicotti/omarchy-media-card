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
  hideWhenIdle: true,
  showVolume: false,
  showOthers: true
}

// Settings that take one of a fixed list; every other setting is valid when it
// has the same type as its default.
var SETTING_OPTIONS = { barStyle: BAR_STYLES }

function isValidSetting(key, value) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return false
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

var PLUGIN_ID = "lucaspicotti.media-card"

// The argv that saves one setting in the widget's shell.json entry; the bar
// hands the new settings back to the widget live. Empty when the value is not
// one the plugin accepts. Run as an argv, never through a shell.
function settingCommand(key, value) {
  if (!isValidSetting(key, value)) return []
  return ["omarchy-bar", "set", PLUGIN_ID, key, JSON.stringify(value), "--json"]
}

// The settings screen's text for a bar style, as i18n keys.
function barStyleLabels(style) {
  return { label: "style." + style, description: "style." + style + "Description" }
}

// The argv that copies a track title, or empty when there is none.
function copyCommand(text) {
  var value = toText(text)
  return value === "" ? [] : ["wl-copy", "--", value]
}

// Takes the already normalized hideWhenIdle (see settingsFrom).
function widgetVisible(hasMedia, hideWhenIdle) {
  return !!hasMedia || !hideWhenIdle
}

// What each bar style draws. A: status icon and text. B: cover, title and
// previous/play/next. C: cover, play/pause and a progress line. A side bar is
// one icon wide, so it keeps only the icon or cover and play/pause.
function barParts(style, vertical) {
  return {
    statusIcon: style === "minimal",
    cover: style !== "minimal",
    skip: style === "controls" && !vertical,
    playPause: style !== "minimal",
    progress: style === "icon" && !vertical
  }
}

// The text beside the controls: "artist — title" for A, the title for B.
function barText(style, track, vertical) {
  if (vertical) return ""
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
    album: toText(p.trackAlbum),
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

// The card's player tabs, as ButtonGroup options; only with more than one.
function tabsFor(players) {
  var list = toArray(players)
  if (list.length < 2) return []
  return list.map(function(player) {
    return { value: playerKey(player), label: playerLabel(player) }
  })
}

// "Também tocando" in the card; showOthers is the normalized setting.
function otherPlayers(players, selectedKey, showOthers) {
  if (!showOthers) return []
  var list = toArray(players)
  var shownKey = shownPlayerKey(list, selectedKey)
  var result = []
  list.forEach(function(player) {
    var key = playerKey(player)
    if (key === shownKey) return
    var track = nowPlaying(player)
    result.push({
      key: key,
      label: playerLabel(player),
      title: track.title,
      stateLabel: player.isPlaying ? "state.playing" : "state.paused",
      artUrl: track.artUrl
    })
  })
  return result
}

// Indexed by Quickshell's MprisLoopState enum: None, Track, Playlist. Labels
// are i18n keys.
var REPEAT_MODES = [
  { mode: "none", icon: "󰑗", label: "card.repeat" },
  { mode: "track", icon: "󰑘", label: "card.repeatTrack" },
  { mode: "playlist", icon: "󰑖", label: "card.repeatPlaylist" }
]

// The state of the transport buttons, with the icon each one shows. Labels
// are i18n keys.
function controlsFor(value) {
  var player = value || {}
  var playing = !!player.isPlaying
  var shuffleOn = !!player.shuffle
  var repeat = REPEAT_MODES[player.loopState] || REPEAT_MODES[0]
  return {
    enabled: {
      previous: !!player.canGoPrevious,
      playPause: !!(player.canTogglePlaying || player.canPlay || player.canPause),
      next: !!player.canGoNext,
      shuffle: !!player.shuffleSupported,
      repeat: !!player.loopSupported,
      raise: !!player.canRaise,
      volume: !!player.volumeSupported
    },
    playing: playing,
    playPauseIcon: playing ? "󰏤" : "󰐊",
    playPauseLabel: playing ? "card.pause" : "card.play",
    shuffleOn: shuffleOn,
    shuffleIcon: shuffleOn ? "󰒝" : "󰒞",
    repeatMode: repeat.mode,
    repeatIcon: repeat.icon,
    repeatLabel: repeat.label
  }
}

// Repeat button: off, whole list, this track, off. Takes and returns
// MprisLoopState values (None 0, Track 1, Playlist 2).
function nextLoopState(loopState) {
  if (loopState === 2) return 1
  if (loopState === 1) return 0
  return 2
}

// MprisPlayer.volume runs from 0 to 1; each wheel step moves it 5 points.
var VOLUME_STEP = 5

function volumeAfter(volume, steps) {
  var current = Number(volume)
  var percent = isFinite(current) ? Math.round(current * 100) : 0
  percent = Math.min(100, Math.max(0, percent + steps * VOLUME_STEP))
  return percent / 100
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
// picks the player itself among mediaPlayers, in order: the one chosen in a
// tab or with the right click, the one playing, the first, none.
function activePlayer(players, preferredKey) {
  var list = mediaPlayers(players)
  return firstWhere(list, function(p) { return playerKey(p) === preferredKey })
    || firstWhere(list, function(p) { return p.isPlaying })
    || list[0] || null
}

// The players the bar and the card deal with: the ones with a track, leaving
// out playerctld, which only mirrors another player (same rule as
// MediaModel.isProxyPlayer in Omarchy's media service).
function mediaPlayers(players) {
  return toArray(players).filter(function(player) { return hasTrack(player) && !isProxyPlayer(player) })
}

function isProxyPlayer(player) {
  var dbusName = String(player.dbusName || "").toLowerCase()
  var desktopEntry = String(player.desktopEntry || "").toLowerCase()
  return dbusName.indexOf("playerctld") !== -1 || desktopEntry === "playerctld"
}

// The first player with a track that is playing, or "".
function playingPlayerKey(players) {
  return playerKey(firstWhere(mediaPlayers(players), function(p) { return p.isPlaying }))
}

// The chosen player stays on until another one starts playing; then the bar
// follows what plays. Called when playingPlayerKey changes.
function preferredKeyAfter(preferredKey, playingKey) {
  return playingKey !== "" && playingKey !== preferredKey ? "" : preferredKey
}

// Right click on the bar: the player after the current one, wrapping around.
function nextPlayerKey(players, currentKey) {
  var list = mediaPlayers(players)
  if (list.length < 2) return ""
  var index = -1
  for (var i = 0; i < list.length; i++) {
    if (playerKey(list[i]) === currentKey) index = i
  }
  return playerKey(list[(Math.max(index, 0) + 1) % list.length])
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
