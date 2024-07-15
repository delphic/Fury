# Fury - Guiding Principals

Fury is a web tech based game engine / framework.

The ideal being to allow easier low level access to WebGL and similar APIs, whilst not to forcing any unnecessary abstractions upon the user.

A focus on procedural content.

Open Source - we're doing this for fun.

Using ES5+ and standards focused - i.e using WebGL2 and Web Audio API without fall backs.

A single vector implementation across rendering, physics and game logic - a fork of [glMatrix](https://github.com/toji/gl-matrix) v3.4.0.

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

### Extensions:
* Render to texture
* Text rendering in WebGL

## Physics, Input & Sound
_Primary focus is on the renderer_. Physics, Input and Sound helpers can be added per project, will assess as needed by demos / use.

[Web Audio API](http://www.html5rocks.com/en/tutorials/webaudio/intro/)

[W3C Gamepad Working Draft](http://www.w3.org/TR/gamepad/)

## Demos
[View Completed Demos](https://delphic.me.uk/fury/demos/)
* ✓ Arbitrary shader demo
* ✓ Simple spinning create demo
* ✓ Instancing / prefab demo
* ✓ Voxel based terrain - MineCraft style
* Voxel based terrain - surface nets
* Lighting demo
* Toon shading demo
* HTML overlay demo
* ✓ Particles demo
* ✓ Model loading & animation demo
* ✓ [MineCraft style game](https://delphic.me.uk/vorld-archipelago) - walk around on the generated terrain
* Texture blending demo - single mesh / patchwork mesh terrain with multiple textures
* Skinned mesh & animation demo

We'll create separate demo for each set of features, essentially integration tests.

We would like to implement some procedural terrain a la [Red Blob](http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/).

# JavaScript Style

Passing Info to Functions:
* Use parameter objects and argument checking on one-time only functions such as inits.
* Use arguments on per frame functions such as loop() / update().

Do not create new objects during a frame unless completely unavoidable (then refactor so you don't have to) or actually creating new things in the game / engine.

Try to keep object and module members public and rely on people using their head (i.e. don't enforce copy vector values, they should do that themselves). Whilst this might result in more errors, it gives greater flexibility and much more straight forward code.

Initially written to prefer using literals over the new keyword, module format is designed accordingly. However when using VSCode - ES5 classes bring improved auto-complete, the benefits of which outweight keeping to Douglas Crockford style, and as such will use ES5 classes within CommonJS modules going forward.

Readable variable names, everywhere, no short-hands / abbreviations, avoid jargon where possible. Only indices are allowed to be single letter.
* Only exceptions are: variables which are used extremely often; e.g. the webGraphicsLibraryContext -> 'gl', using our renderer facade over the context -> 'r', and abbreviations which are _extremely_ well known jargon, e.g. 'fov'

No prefixes, that includes private variables with an underscore. If it has an exports assignment or is part of a literal declaration it's public, if not, it's not. Also no prefixing of type, if you want to include the type in the name use a full word suffix.

## Example Module Format

```javascript
module.exports = function() {
	let exports = {};
	let prototype = {
		protoMethod: function() { ... }
	};

	let privateFunc = function() { ... }; // Can be static or not depending on if you use .apply / .call

	let staticFunc = exports.statFunc = function(args) {

	};

	let create = exports.create = function(config) {
		let object = Object.create(prototype);

		let privateMethod = function() { ... };

		object.property = config.property;
		object.publicMethod = function() { ... };

		return object;
	};

	return exports;
}();
```

Modules are determined by their JavaScript file, and browserify / CommonJS will sort out the rest.
