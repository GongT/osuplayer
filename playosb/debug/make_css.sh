#!/bin/sh
set -e
cd `dirname $BASH_SOURCE`

echo -en 'var DebugWindowCss = \n\t"<style type=\"text/css\">' > debug_css.js
lessc --compress debugwindow.less | sed 's/"/\\"/g' >> debug_css.js
echo -e '</style>"\t;' >> debug_css.js

echo -en 'var DebugMenuCss = \n\t"<style type=\"text/css\">' >> debug_css.js
lessc --compress debugmenu.less | sed 's/"/\\"/g' >> debug_css.js
echo -e '</style>"\t;' >> debug_css.js
