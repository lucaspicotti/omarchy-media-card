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
