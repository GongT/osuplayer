#!/bin/sh
set -e
cd `dirname $BASH_SOURCE`

echo -en 'var DebugWindowCss = \n\t"<style type=\"text/css\">' > debug_css.js
lessc --compress debugwindow.less >> debug_css.js
echo -e '</style>"\t;' >> debug_css.js
