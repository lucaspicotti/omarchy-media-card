import QtQuick

Item {
  property QtObject bar: null
  property string moduleName: ""
  property var settings: ({})
  readonly property int barSize: bar ? bar.barSize : 26
}
