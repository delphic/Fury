# Fury

Fury (as in the mythical creature) - a WebGL based game engine / framework.

The ideal being to allow easy low level access to WebGL, whilst not to forcing any unnecessary abstractions upon the user.

Standards Focused - using WebGL2 and Web Audio API without fall backs.

A single vector implementation across rendering, physics and game logic (glMatrix).

Focus on fast JavaScript, low garbage allocations, without compromising readability.

Examples available in [fury-demos](https://github.com/delphic/fury-demos).

## Usage

[Browserify](http://browserify.org/) `src/client.js` to create an 'old school' library.

That is a JavaScript file which can be imported as a script tag and sets a `Fury` global which can be used.

Use Common JS with `src/fury.js` to include Fury in a more modern manner.
