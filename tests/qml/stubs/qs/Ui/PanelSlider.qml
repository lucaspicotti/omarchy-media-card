import QtQuick

Item {
  property QtObject bar: null
  property real value: 0

  signal moved(real value)

  implicitHeight: 20
}
