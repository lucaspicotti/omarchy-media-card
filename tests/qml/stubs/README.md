Stand-ins for the modules the plugin imports from the Omarchy shell (`qs.Ui`,
`qs.Commons`) and from Quickshell, so `qmltestrunner` can load the real
BarWidget.qml and MediaCard.qml outside the shell. Each one declares only what
the plugin uses, with the same names and signatures as the real component;
tests/qml-stubs.test.js checks that against the installed Omarchy.
