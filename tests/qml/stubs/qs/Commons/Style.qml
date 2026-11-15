pragma Singleton
import QtQuick

QtObject {
  readonly property QtObject font: QtObject {
    property string family: "monospace"
    property real caption: 11
    property real bodySmall: 12
    property real body: 13
    property real subtitle: 15
    property real iconLarge: 18
  }

  readonly property QtObject spacing: QtObject {
    property real labelGap: 4
    property real panelGap: 12
  }

  function space(px) { return px }
  function normalFillFor(foreground, accent, urgent) { return "transparent" }
}
