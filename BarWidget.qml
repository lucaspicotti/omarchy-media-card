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
  readonly property bool hasMedia: !!activePlayer && Model.hasTrack(activePlayer)

  readonly property var config: Model.settingsFrom({
    barStyle: setting("barStyle", "icon"),
    showVolume: setting("showVolume", false),
    showOthers: setting("showOthers", true),
    hideWhenIdle: setting("hideWhenIdle", true)
  })

  readonly property var controls: Model.controlsFor(activePlayer)
  readonly property string title: activePlayer ? String(activePlayer.trackTitle || "") : ""
  readonly property string artist: activePlayer ? String(activePlayer.trackArtist || "") : ""
  readonly property string artUrl: Model.safeArtUrl(activePlayer ? activePlayer.trackArtUrl : "")
  readonly property real progress: activePlayer ? Model.progressFraction(activePlayer.position, activePlayer.length) : 0
  readonly property string minimalText: Model.limitText(artist && title ? artist + " — " + title : (title || artist), 28)

  property bool cardOpen: false
  function close() { cardOpen = false }

  readonly property color foreground: bar ? bar.barForeground : "white"
  readonly property int artSize: Math.min(Style.space(18), barSize - Style.space(6))

  visible: Model.widgetVisible(hasMedia, config)
  implicitWidth: visible ? content.implicitWidth + Style.space(14) : 0
  implicitHeight: barSize

  function playPause() {
    var p = activePlayer
    if (!p) return
    if (p.canTogglePlaying) p.togglePlaying()
    else if (p.isPlaying && p.canPause) p.pause()
    else if (!p.isPlaying && p.canPlay) p.play()
  }
  function next() { if (activePlayer && activePlayer.canGoNext) activePlayer.next() }
  function previous() { if (activePlayer && activePlayer.canGoPrevious) activePlayer.previous() }

  // MPRIS does not push position updates; ask for a fresh value while the
  // progress line is on screen and the track is moving.
  Timer {
    interval: 1000
    repeat: true
    running: root.visible && root.config.barStyle === "icon" && root.controls.playing && !root.cardOpen
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
      url: root.artUrl
      visible: url != ""
    }

    Glyph {
      anchors.horizontalCenter: parent.horizontalCenter
      visible: root.artUrl === ""
      text: "󰝚"
    }
  }

  component TransportButton: Glyph {
    id: button
    property string action: ""
    property bool enabled: true
    opacity: enabled ? 1 : 0.4

    MouseArea {
      anchors.fill: parent
      anchors.margins: -Style.space(3)
      enabled: button.enabled
      cursorShape: Qt.PointingHandCursor
      onClicked: function(mouse) {
        mouse.accepted = true
        if (button.action === "previous") root.previous()
        else if (button.action === "next") root.next()
        else root.playPause()
      }
    }
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

    // A: icon and title.
    Glyph {
      visible: root.config.barStyle === "minimal"
      text: root.controls.playing ? "󰝚" : "󰏤"
      color: Commons.Color.accent
    }

    // B and C: cover.
    Cover {
      visible: root.config.barStyle !== "minimal"
    }

    Glyph {
      visible: root.config.barStyle === "minimal" && root.minimalText !== ""
      text: root.minimalText
    }

    Glyph {
      visible: root.config.barStyle === "controls" && root.title !== ""
      text: Model.limitText(root.title, 24)
    }

    // B: previous, play/pause, next.
    TransportButton {
      visible: root.config.barStyle === "controls"
      action: "previous"
      enabled: root.controls.enabled.previous
      text: "󰒮"
    }

    // B and C: play/pause.
    TransportButton {
      visible: root.config.barStyle !== "minimal"
      action: "playPause"
      enabled: root.controls.enabled.playPause
      text: root.controls.playing ? "󰏤" : "󰐊"
      color: Commons.Color.accent
    }

    TransportButton {
      visible: root.config.barStyle === "controls"
      action: "next"
      enabled: root.controls.enabled.next
      text: "󰒭"
    }
  }

  // C: thin progress line under the cover and the play button.
  Rectangle {
    visible: root.config.barStyle === "icon"
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
    onWheel: function(wheel) {
      if (wheel.angleDelta.y > 0) root.previous()
      else if (wheel.angleDelta.y < 0) root.next()
    }
    onEntered: if (root.bar) root.bar.showTooltip(root, root.title + (root.artist ? " — " + root.artist : ""))
    onExited: if (root.bar) root.bar.hideTooltip(root)
  }
}
