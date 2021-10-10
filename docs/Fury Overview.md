# Fury - Guiding Principals

Fury is a web tech based game engine / framework.

The ideal being to allow easier low level access to WebGL and similar APIs, whilst not to forcing any unnecessary abstractions upon the user.

A focus on procedural content.

Open Source - we're doing this for fun.

Using ES5+ and standards focused - i.e using WebGL2 and Web Audio API without fall backs.

A single vector implementation across rendering, physics and game logic - use glMatrix.

Using a Common JS and browserify, allowing either direct inclusion or build single file.

Focus fast JavaScript, low GC (e.g. parameter objects only on init functions (or memoised), avoid creating objects or vectors in frame), whilst maintaining readability.

## Feature Targets

* ✓ Triangle, Line and Point rendering
* Per Vertex and Per Pixel Lighting support
* ✓ The separation of Shader set up code (which requires the gl object) and GLSL code from the rest of the renderer
* ✓ A stack of objects to render minimising the number of texture assignments
* ✓ prefab / static model instancing 
* ✓ Alpha transparency (and the ordering to allow this properly)
* ✓ Basic scene management (Frustum Culling)
* ✓ glTF model loading
* Multi-texturing
* Specular mapping
* Normal mapping
* Ambient Occlusion
* Skinning and Animation Support

Can use [Building the Game](https://github.com/toji/building-the-game) as a guide for development of features already implemented by toji.

### Extensions:
* Render to texture
* Text rendering in WebGL

## Physics, Input & Sound
_Primary focus is on the renderer_. Physics, Input and Sound helpers will be added as optional modules, will assess as needed by demos / use.

[Web Audio API](http://www.html5rocks.com/en/tutorials/webaudio/intro/)

[W3C Gamepad Working Draft](http://www.w3.org/TR/gamepad/)

(Use of libraries is acceptable if they don't violate the guiding principles of this project, e.g. [GamePad.js](https://github.com/sgraham/gamepad.js/)).

## Demos
[View Completed Demos](http://delphic.me.uk/fury/demos/)
* ✓ Arbitrary shader demo
* ✓ Simple spinning create demo
* ✓ Instancing / prefab demo
* ✓ Voxel based terrain - MineCraft style
* Voxel based terrain - surface nets
* Lighting demo
* Toon shading demo
* HTML overlay demo
* Particles demo
* Animation demo
* MineCraft style game - walk around on the generated terrain
* Texture blending demo - single mesh / patchwork mesh terrain with multiple textures

We'll create separate demo for each set of features, essentially integration tests.

We would like to implement some procedural terrain a la [Red Blob](http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/).

# JavaScript Style

Passing Info to Functions:
* Use parameter objects and argument checking on one-time only functions such as inits.
* Use arguments on per frame functions such as loop() / update().

Do not create new objects during a frame unless completely unavoidable (then refactor so you don't have to) or actually creating new things in the game / engine.

Try to keep class members public and rely on people using their head (i.e. don't enforce copy vector values, they should do that themselves). Whilst this might result in more errors, it gives greater flexibility and much more straight forward code.

Avoid the new keyword where-ever possible, use literals, class format is designed accordingly.

Readable variable names, everywhere, no short-hands / abbreviations, avoid jargon where possible. Only indices are allowed to be single letter.
* Only exceptions are: variables which are used extremely often; e.g. the webGraphicsLibraryContext -> 'gl', and abbreviations which are _extremely_ well known jargon, e.g. 'fov'

No prefixes, that includes private variables with an underscore. If it has an exports assignment or is part of a literal declaration it's public, if not, it's not. Also no prefixing of type, if you want to give the type put the word at the end of the variable name.

## Example Class Format

```javascript
var Class = module.exports = function() {
	var exports = {};
	var prototype = {
		protoMethod: function() { ... }
	};

	var privateFunc = function() { ... }; // Can be static or not depending on if you use .apply / .call

	var staticFunc = exports.statFunc = function(args) {

	};

	var create = exports.create = function(params) {
		var object = Object.create(prototype);

		var privateMethod = function() { ... };

		object.property = params.property;
		object.publicMethod = function() { ... };

		return object;
	};
	return exports;
}();
```

Modules are determined by their JavaScript file, and browserify / CommonJS will sort out the rest.
