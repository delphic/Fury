# Fury

Fury a web tech based game engine.

Focused on allowing easy access to WebGL and other standard APIs, whilst not forcing any unnecessary abstractions upon the user.

A single vector implementation across rendering, physics and game logic ([glMatrix](https://github.com/toji/gl-matrix)).

Focus on fast idiomatic JavaScript, low garbage allocations, without compromising readability.

Examples available in [fury-demos](https://github.com/delphic/fury-demos), [vorld-decay](https://github.com/delphic/vorld-decay) and [vorld-archipelago](https://github.com/delphic/vorld-archipelago).

Fury was created for personal use and learning and as such makes minimal use of libraries.

## Usage

[Browserify](http://browserify.org/) `src/client.js` to create an 'old school' library.

That is a JavaScript file which can be imported as a script tag and sets a `Fury` global which can be used.

Use Common JS with `src/fury.js` to include Fury in a more modern manner.
