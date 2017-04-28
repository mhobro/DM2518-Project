# DM2518-Project
Webapp development for a course at KTH

First install the following things.

	npm install -g cordova
	npm install -g ionic
	npm install -g bower
	npm install -g grunt
	npm install -g yo 

(yo might not be needed, since the project is already
generated, but yeoman can still be used to generate angular components)

Cordova plugins that might be missing:

	cordova plugin add cordova-plugin-ionic-keyboard
	cordova plugin add cordova-plugin-console
	cordova plugin add cordova-plugin-device
	cordova plugin add cordova-plugin-geolocation
	cordova plugin add cordova-plugin-splashscreen

Run the commands if needed (in the directory of the project).

Run this to start a local dev server with live reload.

	grunt serve 

Please add to this if something is missing.
