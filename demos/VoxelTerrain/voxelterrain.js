// Voxel Terrain
// First Method to implement
// Multiple Octaves of Perlin / Simplex noise -> Cubes

// glMatrix extension, seems to work should probably fork the repo
quat.rotate = (function() { 
	var i = quat.create();
	return function(out, q, rad, axis) {
		quat.setAxisAngle(i, axis, rad);
		return quat.multiply(out, i, q);
	}
})();

// Predicatable but kinda random numbers for seed based generation
var createSeed = function(seedValue) {
	var minCode = seedValue.charCodeAt(0), maxCode = seedValue.charCodeAt(0), i = 0, j;
	for(var n = 1, l = seedValue.length; n < l; n++) {
		minCode = Math.min(minCode, seedValue.charCodeAt(n));
		maxCode = Math.max(maxCode, seedValue.charCodeAt(n));
	}
	var number = function(index) {
		return (seedValue.charCodeAt(index) - (minCode - 0.0001)) / (maxCode + 0.001);
	};
	j = Math.floor(seedValue.length*number(0));
	return {
		random: function() {
			var result = 0.5*(number(i) + number(j));
			i+=1;
			j+=2;
			if(i>=seedValue.length) { i = 0; }
			if(j>=seedValue.length) { j = j%seedValue.length; }
			return result;
		}
	};
};
var testSeedString = "XUVNREAZOZJFPQMSAKEMSDJURTQPWEORHZMD";

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

// Create Camera & Scene 
var rotateRate = Math.PI;
var zoomRate = 16;	
var initalRotation = quat.create();
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 4/3, position: vec3.fromValues(0.0, 32.0, 128.0) });	
var scene = Fury.Scene.create({ camera: camera });
var blocks = [];

createBlockPrefab("grass", atlasMaterial, [1,0], [0,0], [0,1]);
createBlockPrefab("soil", atlasMaterial, [0,1], [0,1], [0,1]);
createBlockPrefab("stone", atlasMaterial, [1,1], [1,1], [1,1]);

var lastTime = Date.now();

var clear = function() {
	for(var i = 0, l = blocks.length; i < l; i++) {
		blocks[i].remove();
	}
	blocks.length = 0;
};

var awake = function() {
	// Note this needs to happen after materials loaded so that when they are copied the textures have loaded.
	// Perhaps textures should be stored at the Fury (Fury.Engine) level and thus loading callbacks will provide the texture to all materials
	// who have that texture id and this will work even if they've been copied prior to texture load
	// More sensible would giving Fury this awake / update functionality so we don't need to write it each time.

	// Add Blocks to Scene

	// Use octaves where the octave integer is k you sample at x(2^k) and y(2^k) where 2^k is wavelength and naturally 1/(2^k) is frequency each octave needs a weighing

	// Divide by m * (maxdepth + y) and adjust m as initial way to ensure air / ground distinction
	// Try < 0.5 Air, 0.5 - 0.8 Soil, 0.8 - 1.0 Stone
	var getBlockType = function(value) {
		if(value < 0.5) {
			return "";
		}
		if(value < 0.8) {
			return "soil";
		}
		return "stone";
	};

	var octaves = [], numOctaves = 4;
	var octaveWeightings = [ 0.5, 0.5, 0.25, 0.1 ];
	var maxDepth = 32, x, y, z, i, j, k, o, adjust, m = 0.01;	// TODO: Expose m via form
	var scale = vec3.fromValues(0.5,0.5,0.5);
	var chunk = { 
		blocks: [],
		size: 64,
		addBlock: function(i,j,k,block) {
			this.blocks[i + this.size*j + this.size*this.size*k] = block;
		},
		getBlock: function(i,j,k) {
			return this.blocks[i + this.size*j + this.size*this.size*k];
		}
	};

	for(o = 0; o < numOctaves; o++) {
		// TODO: Flag for Simpelx versus Classical Noise
		octaves.push(new ClassicalNoise(createSeed(testSeedString)));
	}

	// Determine block from noise function
	for(i = 0; i < chunk.size; i++) {
		for(j = 0; j < chunk.size; j++) {
			y = j - Math.floor(chunk.size/2.0);
			for(k = 0; k < chunk.size; k++) {
				adjust = m * (maxDepth + y);
				var value = 0;
				var totalWeight = 0;
				for(o = 0; o < numOctaves; o++) {
					var wavelength = Math.pow(2, o);
					totalWeight += octaveWeightings[o];
					value += octaveWeightings[o] * octaves[o].noise(wavelength*i/chunk.size, wavelength*j/chunk.size, wavelength*k/chunk.size);
				}
				value /= totalWeight;
				var block = getBlockType(value / adjust);
				chunk.addBlock(i,j,k,block)
			}
		}
	}
	// Spawn just blocks on an edge
	// Technically we should be itterating over chunks in a separate function, but you know get it working for a single chunk first
	for(i = 0; i < chunk.size; i++) {
		x = i - Math.floor(chunk.size/2.0);
		for(j = 0; j < chunk.size; j++) {
			y = j - Math.floor(chunk.size/2.0);
			for(k = 0; k < chunk.size; k++) {
				z = k - Math.floor(chunk.size/2.0);
				// Does Exist and is on any edge?
				if(chunk.getBlock(i,j,k) 
					&& ((!chunk.getBlock(i,j+1,k) || !chunk.getBlock(i,j-1,k) || !chunk.getBlock(i+1,j,k) || !chunk.getBlock(i-1,j,k) || !chunk.getBlock(i,j,k+1) || !chunk.getBlock(i,j,k-1)) 
						|| (j+1 >= chunk.size  || j-1 < 0 || i+1 >= chunk.size || i-1 < 0 || k+1 >= chunk.size || k-1 < 0))) { // Note the checks on index only apply when rendering a single chunk if rendering multiple chunks these checks should not be performed
					var block = chunk.getBlock(i,j,k);
					if(block == "soil" && !chunk.getBlock(i,j+1,k)) {
						blocks.push(scene.instantiate({ name: "grass", position: vec3.fromValues(x,y,z), scale: scale }));
					} else {
						blocks.push(scene.instantiate({ name: block, position: vec3.fromValues(x,y,z), scale: scale }));
					}
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

var localx = vec3.create();
var localz = vec3.create();
var unitx = vec3.fromValues(1,0,0);
var unity = vec3.fromValues(0,1,0);
var unitz = vec3.fromValues(0,0,1); 

var handleInput = function(elapsed) {
	var q = camera.rotation;
	var p = camera.position;
	vec3.transformQuat(localx, unitx, q);
	vec3.transformQuat(localz, unitz, q);

	if(Input.keyDown("Left")) {
		quat.rotate(q, q, rotateRate*elapsed, unity);
	}
	if(Input.keyDown("Right")) {
		quat.rotate(q, q, -rotateRate*elapsed, unity);
	}
	if(Input.keyDown("Up")) {
		quat.rotateX(q, q, rotateRate*elapsed);
	}
	if(Input.keyDown("Down")) {
		quat.rotateX(q, q, -rotateRate*elapsed);
	}
	if(Input.keyDown("w")) {
		vec3.scaleAndAdd(p, p, localz, -zoomRate*elapsed);
	}
	if(Input.keyDown("s")) {
		vec3.scaleAndAdd(p, p, localz, zoomRate*elapsed);
	}
	if(Input.keyDown("a")) {
		vec3.scaleAndAdd(p, p, localx, -zoomRate*elapsed);
	}
	if(Input.keyDown("d")) {
		vec3.scaleAndAdd(p, p, localx, zoomRate*elapsed);
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



