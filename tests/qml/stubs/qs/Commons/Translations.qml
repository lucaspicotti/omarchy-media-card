import QtQuick

// Reads the plugin's own en.json, so the tests see the English strings the
// shell would show (needs QML_XHR_ALLOW_FILE_READ=1).
QtObject {
  id: root
  property var directory: ""

  readonly property var strings: {
    if (!directory) return ({})
    var request = new XMLHttpRequest()
    request.open("GET", String(directory).replace(/\/+$/, "") + "/en.json", false)
    request.send()
    return JSON.parse(request.responseText)
  }

  function t(key, fallback) {
    var value = root.strings[key]
    return value !== undefined ? value : (fallback !== undefined ? fallback : key)
  }
}
