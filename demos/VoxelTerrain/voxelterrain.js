// Voxel Terrain
// First Method to implement
// Multiple Octaves of Perlin / Simplex noise -> Cubes

Fury.init("fury");
var Input = Fury.Input;

// Basic Cube JSON
// Note each cube type needs to have its own mesh with adjusted texture coordinates
var cubeJson = {
	vertices: [ -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0 ],
	normals: [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0 ],
	textureCoordinates: [ 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 ],
	indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ]
};	

var shader = Fury.Shader.create({
	vsSource: [
		"attribute vec3 aVertexPosition;",
		"attribute vec2 aTextureCoord;",

		"uniform mat4 uMVMatrix;",
		"uniform mat4 uPMatrix;",

		"varying vec2 vTextureCoord;",
		"void main(void) {",
			"gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);",
			"vTextureCoord = aTextureCoord;",
		"}"].join('\n'),
	fsSource: [
		"precision mediump float;",

		"varying vec2 vTextureCoord;",

		"uniform sampler2D uSampler;",

		"void main(void) {",
			"gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));",
		"}"].join('\n'),
		attributeNames: [ "aVertexPosition", "aTextureCoord" ],
		uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler"],
		textureUniformNames: [ "uSampler" ],
		pMatrixUniformName: "uPMatrix",
		mvMatrixUniformName: "uMVMatrix",
		bindMaterial: function(material) { },
		bindBuffers: function(mesh) {
			this.enableAttribute("aVertexPosition");
			this.enableAttribute("aTextureCoord");
			this.setAttribute("aVertexPosition", mesh.vertexBuffer);
			this.setAttribute("aTextureCoord", mesh.textureBuffer);
			this.setIndexedAttribute(mesh.indexBuffer);
		}
});

// Block Prefab Creation Helpers

var adjustTextureCoords = function(textureArray, faceIndex, offset, divisor) {
	for(var i = 8*faceIndex, l = i + 8; i < l; i+=2) {
		textureArray[i] = (textureArray[i] + offset[0]) / divisor[0];		// s
		textureArray[i+1] = (textureArray[i+1] + (divisor[1] - offset[1] - 1)) / divisor[1]; 	// t
	}
};

var createBlockPrefab = function(name, material, sideTile, topTile, bottomTile) {
	// Copy the cube JSON into a new JSON object for manipulation
	var adjustedCube = {
		vertices: cubeJson.vertices.slice(0),
		textureCoordinates: cubeJson.textureCoordinates.slice(0),
		indices: cubeJson.indices.slice(0)
	};
	// Adjust texture coordinates
	// Order of sides are front, back, top, bottom, right, left
	for(var i = 0; i < 6; i++) {
		if(i == 2) {
			adjustTextureCoords(adjustedCube.textureCoordinates, i, topTile, atlasSize);
		} else if (i == 3) {
			adjustTextureCoords(adjustedCube.textureCoordinates, i, bottomTile, atlasSize);
		} else {
			adjustTextureCoords(adjustedCube.textureCoordinates, i, sideTile, atlasSize);
		}
	}

	var mesh = Fury.Mesh.create(adjustedCube);
	Fury.createPrefab({ name: name, material: material, mesh: mesh });
};

// End Block Prefab Creation Helpers

var atlasSize = [2, 2];
var atlasMaterial = Fury.Material.create({ shader: shader });
// TODO: Apply atlas texture to material

// Create Camera & Scene 
var rotateRate = Math.PI;
var zoomRate = 4;
var initalRotation = quat.create();
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 1.0, position: vec3.fromValues(0.0, 0.0, -55.0), rotation: quat.rotateY(initalRotation, quat.rotateX(initalRotation, initalRotation, Math.PI/4.0), -Math.PI/4.0) });	
// Oh dear the camera rotation is not working, it's being applied after the position transform, making the camera rotate around the origin, kind of useful but not a standard camera!
// TODO: Fix so camera works properly but add a "look at" camera change this demo to use that camera
var scene = Fury.Scene.create({ camera: camera });

createBlockPrefab("grass", atlasMaterial, [1,0], [0,0], [0,1]);
createBlockPrefab("soil", atlasMaterial, [0,1], [0,1], [0,1]);
createBlockPrefab("stone", atlasMaterial, [1,1], [1,1], [1,1]);

var lastTime = Date.now();

var awake = function() {
	// Note this needs to happen after materials loaded so that when they are copied the textures have loaded.
	// Perhaps textures should be stored at the Fury (Fury.Engine) level and thus loading callbacks will provide the texture to all materials
	// who have that texture id and this will work even if they've been copied prior to texture load

	// Add Blocks to Scene

	// First up one noise function (equivilent to 0th Octave)
	// will then try to use octaves where the octave integer is k you sample at x(2^k) and y(2^k) where 2^k is wavelength and naturally 1/(2^k) is frequency each octave needs a weighing

	// TODO: Use Noise to determine please

	// Try 3D Noise First - almost honestly I think a multi-octave heightmap with caves carved out using 3D perlin noise is likely to give better results.
	// 2^5 chunk first
	// Divide by m * (maxdepth + y) and adjust m as initial way to ensure air / ground distinction
	// Try < 0.5 Air, 0.5 - 0.8 Soil, 0.8 - 1.0 Stone - will need edge detection for grass?
	var getChunk = function(value) {
		if(value < 0.5) {
			return "air";
		}
		if(value < 0.8) {
			return "soil";
		}
		return "stone";
	};
	var Perlin = new ClassicalNoise(); // TODO: Flag for Simpelx versus Classical Noise
	var size = 32, maxDepth = 16, x, y, z, i, j, k, adjust, m = 0.01;	// TODO: Expose m via form
	var scale = vec3.fromValues(0.5,0.5,0.5);
	// TODO: Need edge detection before instantiating objects OR need occulusion culling, slows down quite strongly at 2^6
	// This will also allow us to figure out which should be grass rather than soil!
	for(i = 0; i < size; i++) {
		x = i - Math.floor(size/2.0);
		for(j = 0; j < size; j++) {
			y = j - Math.floor(size/2.0);
			for(k = 0; k < size; k++) {
				z = k - Math.floor(size/2.0);
				adjust = m * (maxDepth + y);
				var chunk = getChunk(Perlin.noise(i/size, j/size, k/size) / adjust);
				if(chunk != "air") {
					scene.instantiate({ name: chunk, position: vec3.fromValues(x,y,z), scale: scale });
				}
			}
		}
	}
	loop();
};

var loop = function(){
	var elapsed = Date.now() - lastTime;
	lastTime += elapsed;
	elapsed /= 1000;
	handleInput(elapsed);
	scene.render();
	setTimeout(loop, 1);
};

var handleInput = function(elapsed) {
	var q = camera.rotation;
	var p = camera.position;
	if(Input.keyDown("Left")) {
		quat.rotateY(q, q, rotateRate*elapsed);
	}
	if(Input.keyDown("Right")) {
		quat.rotateY(q, q, -rotateRate*elapsed);
	}
	if(Input.keyDown("Up")) {
		quat.rotateX(q, q, rotateRate*elapsed);
	}
	if(Input.keyDown("Down")) {
		quat.rotateX(q, q, -rotateRate*elapsed);
	}
	if(Input.keyDown("w")) {
		p[2] += zoomRate*elapsed;
		if(p[2] > 0) { 
			p[2] = 0; 
		}
	}
	if(Input.keyDown("s")) {
		p[2] -= zoomRate*elapsed;
	}
};

// Create Texture
var image = new Image();
image.onload = function() {
	var texture = Fury.Renderer.createTexture(image, "low", true);
	atlasMaterial.textures["uSampler"] = texture;
	awake();
};
image.src = "atlas.png";



