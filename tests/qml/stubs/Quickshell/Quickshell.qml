pragma Singleton
import QtQuick

// Records what the plugin would run instead of running it.
QtObject {
  property var executed: []
  function execDetached(argv) { executed = executed.concat([argv]) }
}
