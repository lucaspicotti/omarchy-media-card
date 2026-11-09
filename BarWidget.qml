import QtQuick
import Quickshell
import Quickshell.Services.Mpris
import qs.Ui
import qs.Commons
import qs.Commons as Commons
import "MediaCardModel.js" as Model

// The bar end of the plugin. All decisions (which player, what to show, what
// is enabled, which cover is safe to load) come from MediaCardModel.js; this
// file only draws them. Players are read straight from Quickshell's MPRIS
// list: Omarchy does not hand its own media service to third-party plugins.
BarWidget {
  id: root
  moduleName: "lucaspicotti.media-card"

  readonly property var players: Mpris.players ? Mpris.players.values : []
  // Set from the card's tabs; the model drops it once that player has no track.
  property string preferredKey: ""
  readonly property var activePlayer: Model.activePlayer(players, preferredKey)

  // settingsFrom fills in the defaults, so the raw map goes in as it is.
  readonly property var config: Model.settingsFrom(settings)
  readonly property var parts: Model.barParts(config.barStyle)

  readonly property var controls: Model.controlsFor(activePlayer)
  readonly property var track: Model.nowPlaying(activePlayer)
  // Kept apart from track: it changes every second while playing.
  readonly property real progress: activePlayer ? Model.progressFraction(activePlayer.position, activePlayer.length) : 0

  readonly property string tooltip: Model.trackLine(track.title, track.artist)

  property bool cardOpen: false
  function close() { cardOpen = false }

  readonly property color foreground: bar ? bar.barForeground : "white"
  readonly property int artSize: Math.min(Style.space(18), barSize - Style.space(6))

  visible: Model.widgetVisible(track.hasMedia, config.hideWhenIdle)
  implicitWidth: visible ? content.implicitWidth + Style.space(14) : 0
  implicitHeight: barSize

  function playPause() {
    var method = Model.playPauseMethod(activePlayer)
    if (method) activePlayer[method]()
  }
  function next() { if (controls.enabled.next) activePlayer.next() }
  function previous() { if (controls.enabled.previous) activePlayer.previous() }

  // A wheel notch skips one track; a touchpad adds up its small deltas until
  // they make a notch's worth.
  property real wheelAccumulator: 0
  function scroll(delta) {
    var wheel = Util.wheelSteps(wheelAccumulator, delta)
    wheelAccumulator = wheel.remainder
    if (wheel.steps > 0) previous()
    else if (wheel.steps < 0) next()
  }

  // MPRIS does not push position updates; ask for a fresh value while the
  // progress line is on screen and the track is moving.
  Timer {
    interval: 1000
    repeat: true
    running: progressLine.visible && root.controls.playing && !root.cardOpen
    onTriggered: if (root.activePlayer) root.activePlayer.positionChanged()
  }

  component Glyph: Text {
    textFormat: Text.PlainText
    color: root.foreground
    font.family: root.bar ? root.bar.fontFamily : ""
    font.pixelSize: Style.font.body
    anchors.verticalCenter: parent ? parent.verticalCenter : undefined
  }

  component Cover: Item {
    width: root.artSize
    height: root.artSize
    anchors.verticalCenter: parent ? parent.verticalCenter : undefined

    SizedImage {
      anchors.fill: parent
      crop: true
      url: root.track.artUrl
      visible: url != ""
    }

    Glyph {
      anchors.horizontalCenter: parent.horizontalCenter
      visible: root.track.artUrl === ""
      text: "󰝚"
    }
  }

  // The shell's own bar button: press feedback, optical centring and the
  // bar's click-target registration come with it.
  component TransportButton: WidgetButton {
    property bool available: true
    bar: root.bar
    foreground: root.foreground
    interactive: available
    dimmed: !available
    tooltipText: root.tooltip
    onWheelMoved: function(delta) { root.scroll(delta) }
  }

  // Row cannot align children vertically on its own; each child centres itself
  // in the bar height instead (see Glyph and Cover).
  Row {
    id: content
    anchors.centerIn: parent
    height: root.barSize
    spacing: Style.space(6)
    // Transport controls keep their order in right-to-left languages.
    LayoutMirroring.enabled: false
    LayoutMirroring.childrenInherit: true

    // Which parts each style shows: see Model.barParts.
    Glyph {
      visible: root.parts.statusIcon
      text: root.controls.playing ? "󰝚" : "󰏤"
      color: Commons.Color.accent
    }

    Cover {
      visible: root.parts.cover
    }

    Glyph {
      text: Model.barText(root.config.barStyle, root.track)
      visible: text !== ""
    }

    TransportButton {
      visible: root.parts.skip
      available: root.controls.enabled.previous
      text: "󰒮"
      onPressed: root.previous()
    }

    TransportButton {
      visible: root.parts.playPause
      available: root.controls.enabled.playPause
      text: root.controls.playing ? "󰏤" : "󰐊"
      foreground: Commons.Color.accent
      onPressed: root.playPause()
    }

    TransportButton {
      visible: root.parts.skip
      available: root.controls.enabled.next
      text: "󰒭"
      onPressed: root.next()
    }
  }

  // C: thin progress line under the cover and the play button.
  Rectangle {
    id: progressLine
    visible: root.parts.progress
    anchors.horizontalCenter: content.horizontalCenter
    anchors.bottom: parent.bottom
    anchors.bottomMargin: Style.space(3)
    width: content.width
    height: Math.max(1, Style.space(2))
    radius: height / 2
    color: Qt.darker(root.foreground, 2.2)

    Rectangle {
      width: parent.width * root.progress
      height: parent.height
      radius: parent.radius
      color: Commons.Color.accent
    }
  }

  // Click anywhere else on the widget: open or close the card. Middle click
  // pauses, the wheel skips, as the built-in media widget does.
  MouseArea {
    anchors.fill: parent
    z: -1
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    acceptedButtons: Qt.LeftButton | Qt.MiddleButton
    onClicked: function(mouse) {
      if (mouse.button === Qt.MiddleButton) root.playPause()
      else root.cardOpen = !root.cardOpen
    }
    onWheel: function(wheel) { root.scroll(wheel.angleDelta.y) }
    onEntered: if (root.bar) root.bar.showTooltip(root, root.tooltip)
    onExited: if (root.bar) root.bar.hideTooltip(root)
  }
}
