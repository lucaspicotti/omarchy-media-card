import QtQuick

// An MprisPlayer as Quickshell exposes it (same property and method names),
// counting the calls the plugin makes.
QtObject {
  property string dbusName: "org.mpris.MediaPlayer2.fake"
  property string identity: "Fake"
  property string desktopEntry: ""
  property string trackTitle: ""
  property string trackArtist: ""
  property string trackAlbum: ""
  property string trackArtUrl: ""
  property bool isPlaying: false
  property real position: 0
  property real length: 0

  property bool canPlay: true
  property bool canPause: true
  property bool canTogglePlaying: true
  property bool canGoNext: true
  property bool canGoPrevious: true
  property bool canRaise: true
  property bool shuffleSupported: true
  property bool shuffle: false
  property bool loopSupported: true
  property int loopState: 0
  property bool volumeSupported: true
  property real volume: 0.5

  property int nextCalls: 0
  property int previousCalls: 0
  property int raiseCalls: 0

  function togglePlaying() { isPlaying = !isPlaying }
  function play() { isPlaying = true }
  function pause() { isPlaying = false }
  function next() { nextCalls++ }
  function previous() { previousCalls++ }
  function raise() { raiseCalls++ }
}
