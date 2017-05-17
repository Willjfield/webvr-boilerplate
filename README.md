# WebVR Boilerplate

A [THREE.js][three]-based starting point for cross-platform web-based VR
experiences.

This project relies heavily on the [WebVR Polyfill][polyfill] to provide VR
support if the [WebVR API][spec] is not implemented. It also uses the [WebVR
UI][ui] project to render the UI to enter VR and magic window modes. See here
for a [live demo][demo].

[three]: http://threejs.org/
[polyfill]: https://github.com/googlevr/webvr-polyfill
[ui]: https://github.com/googlevr/webvr-ui
[spec]: https://w3c.github.io/webvr/
[demo]: https://borismus.github.io/webvr-boilerplate/

## Getting started

The easiest way to start is to fork or clone this repository. The boilerplate is
also available via npm. Easy install:

    npm install webvr-boilerplate

## Setting Up Server

Requesting permissions for the controller requires a server with SSL which can be done with

[http-server]: https://www.npmjs.com/package/http-server

 using the -S flag. You will need to generate a new cert and key which can be done with 

[the following directions]: http://brianflove.com/2014/12/01/self-signed-ssl-certificate-on-mac-yosemite/ 

but you will need to rename the generated cert and key files to cert.pem and key.pem
