import QtQuick
import QtQuick.Layouts
import Quickshell
import Quickshell.Services.Mpris
import qs.Ui
import qs.Commons
import qs.Commons as Commons
import "MediaCardModel.js" as Model

// The bar end of the plugin; a click opens MediaCard.qml. All decisions (which
// player, what to show, what is enabled, which cover is safe to load) come
// from MediaCardModel.js; this file only draws them. Players are read straight
// from Quickshell's MPRIS list: Omarchy does not hand its own media service to
// third-party plugins.
BarWidget {
  id: root
  moduleName: "lucaspicotti.media-card"

  readonly property var players: Mpris.players ? Mpris.players.values : []
  // Set from the card's tabs and the right click; it gives way once another
  // player starts playing (Model.preferredKeyAfter), and the model skips it
  // once that player has no track.
  property string preferredKey: ""
  readonly property string playingKey: Model.playingPlayerKey(players)
  onPlayingKeyChanged: preferredKey = Model.preferredKeyAfter(preferredKey, playingKey)
  readonly property var activePlayer: Model.activePlayer(players, preferredKey)

  // settingsFrom fills in the defaults, so the raw map goes in as it is.
  readonly property var config: Model.settingsFrom(settings)
  readonly property var parts: Model.barParts(config.barStyle, vertical)

  readonly property var controls: Model.controlsFor(activePlayer)
  readonly property var track: Model.nowPlaying(activePlayer)
  // Kept apart from track: it changes every second while playing.
  readonly property real progress: activePlayer ? Model.progressFraction(activePlayer.position, activePlayer.length) : 0

  readonly property string tooltip: Model.trackLine(track.title, track.artist)

  readonly property bool hasMedia: track.hasMedia
  property bool cardOpen: false
  // Closed when the media ends, so it does not pop open with the next track.
  onHasMediaChanged: if (!hasMedia) close()

  // The shell's Bar.qml calls close() when another popup opens, and open() for
  // `omarchy-shell shell summon lucaspicotti.media-card` (a keybinding).
  readonly property bool opened: cardOpen
  function open() {
    if (hasMedia) cardOpen = true
  }
  function close() {
    cardOpen = false
  }
  // Through open(), so a click with nothing playing leaves nothing waiting.
  function toggleCard() {
    if (cardOpen) close()
    else open()
  }

  // The bar shows its tooltip only for a target that says it is hovered.
  readonly property bool tooltipHovered: visible && widgetMouse.containsMouse

  readonly property color foreground: bar ? bar.barForeground : "white"
  readonly property int artSize: Math.min(Style.space(18), barSize - Style.space(6))

  visible: Model.widgetVisible(hasMedia, config.hideWhenIdle)
  // A side bar is barSize wide; the content stacks down it instead.
  implicitWidth: !visible ? 0 : vertical ? barSize : content.implicitWidth + Style.space(14)
  implicitHeight: vertical ? content.implicitHeight + Style.space(14) : barSize

  function playPause() {
    var method = Model.playPauseMethod(activePlayer)
    if (method) activePlayer[method]()
  }
  function next() { if (controls.enabled.next) activePlayer.next() }
  function previous() { if (controls.enabled.previous) activePlayer.previous() }

  // Right click: the next player with a track.
  function switchPlayer() {
    var key = Model.nextPlayerKey(players, Model.playerKey(activePlayer))
    if (key) preferredKey = key
  }

  // A wheel notch moves the player's own volume 5 points; a touchpad adds up
  // its small deltas until they make a notch's worth.
  property real wheelAccumulator: 0
  function wheel(delta) {
    var steps = Util.wheelSteps(wheelAccumulator, delta)
    wheelAccumulator = steps.remainder
    if (steps.steps !== 0 && controls.enabled.volume) {
      activePlayer.volume = Model.volumeAfter(activePlayer.volume, steps.steps)
    }
  }

  // MPRIS does not push position updates; ask for a fresh value while the
  // progress line or the card is on screen and the track is moving.
  Timer {
    interval: 1000
    repeat: true
    running: (progressLine.visible || root.cardOpen) && root.controls.playing
    onTriggered: if (root.activePlayer) root.activePlayer.positionChanged()
  }

  component Glyph: Text {
    textFormat: Text.PlainText
    color: root.foreground
    font.family: root.bar ? root.bar.fontFamily : ""
    font.pixelSize: Style.font.body
    Layout.alignment: Qt.AlignCenter
  }

  component Cover: Item {
    implicitWidth: root.artSize
    implicitHeight: root.artSize
    Layout.alignment: Qt.AlignCenter

    SizedImage {
      anchors.fill: parent
      crop: true
      url: root.track.artUrl
      visible: url != ""
    }

    Glyph {
      anchors.centerIn: parent
      visible: root.track.artUrl === ""
      text: "󰝚"
    }
  }

  // The shell's own bar button: press feedback, optical centring and the
  // bar's click-target registration come with it. It takes all three mouse
  // buttons, so right and middle click do here what they do on the rest of the
  // widget; a left click runs the button's action when the player allows it.
  component TransportButton: WidgetButton {
    property bool available: true
    signal triggered()
    bar: root.bar
    foreground: root.foreground
    dimmed: !available
    tooltipText: root.tooltip
    Layout.alignment: Qt.AlignCenter
    onPressed: function(button) {
      if (button === Qt.RightButton) root.switchPlayer()
      else if (button === Qt.MiddleButton) root.playPause()
      else if (available) triggered()
    }
    onWheelMoved: function(delta) { root.wheel(delta) }
  }

  // One row along a top or bottom bar, one column down a side bar.
  GridLayout {
    id: content
    anchors.centerIn: parent
    flow: root.vertical ? GridLayout.TopToBottom : GridLayout.LeftToRight
    rowSpacing: Style.space(6)
    columnSpacing: Style.space(6)
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
      text: Model.barText(root.config.barStyle, root.track, root.vertical)
      visible: text !== ""
    }

    TransportButton {
      visible: root.parts.skip
      available: root.controls.enabled.previous
      text: "󰒮"
      onTriggered: root.previous()
    }

    TransportButton {
      visible: root.parts.playPause
      available: root.controls.enabled.playPause
      text: root.controls.playPauseIcon
      foreground: Commons.Color.accent
      onTriggered: root.playPause()
    }

    TransportButton {
      visible: root.parts.skip
      available: root.controls.enabled.next
      text: "󰒭"
      onTriggered: root.next()
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

  // Anywhere else on the widget (design 1): click opens the card, middle click
  // plays or pauses, right click switches players, the wheel sets the volume.
  MouseArea {
    id: widgetMouse
    anchors.fill: parent
    z: -1
    hoverEnabled: true
    cursorShape: Qt.PointingHandCursor
    acceptedButtons: Qt.LeftButton | Qt.MiddleButton | Qt.RightButton
    onClicked: function(mouse) {
      if (mouse.button === Qt.MiddleButton) root.playPause()
      else if (mouse.button === Qt.RightButton) root.switchPlayer()
      else root.toggleCard()
    }
    onWheel: function(wheel) { root.wheel(wheel.angleDelta.y) }
    onEntered: if (root.bar) root.bar.showTooltip(root, root.tooltip)
    onExited: if (root.bar) root.bar.hideTooltip(root)
  }

  MediaCard {
    anchorItem: root
    bar: root.bar
    owner: root
    widget: root
    open: root.cardOpen && root.hasMedia
  }
}
