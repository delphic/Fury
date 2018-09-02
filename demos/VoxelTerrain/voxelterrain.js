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

Fury.init("fury");
var Input = Fury.Input;

// Basic Cube JSON
var cubeJson = {
	vertices: [ -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0 ],
	normals: [ 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0],
	textureCoordinates: [ 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0 ],
	indices: [ 0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23 ]
};
var cubeFaces = {
	front: 0,
	back: 1,
	top: 2,
	bottom: 3,
	right: 4,
	left: 5
};

var shader = Fury.Shader.create({
	vsSource: [
		"attribute vec3 aVertexPosition;",
		"attribute vec3 aVertexNormal;",
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
		attributeNames: [ "aVertexPosition", "aVertexNormal", "aTextureCoord" ],
		uniformNames: [ "uMVMatrix", "uPMatrix", "uSampler" ],
		textureUniformNames: [ "uSampler" ],
		pMatrixUniformName: "uPMatrix",
		mvMatrixUniformName: "uMVMatrix",
		bindMaterial: function(material) {
			this.enableAttribute("aVertexPosition");
			this.enableAttribute("aTextureCoord");
		},
		bindBuffers: function(mesh) {
			this.setAttribute("aVertexPosition", mesh.vertexBuffer);	// Is this definately the best way to set buffers?
			this.setAttribute("aVertexNormal", mesh.normalBuffer);
			// TODO: To use this we need a new NMatrix too, going to nee dto add that to the Shader options in the same way as we have pMatrixUniformName as it's a special matrix
			// to adjust for camera rotation. c.f. http://learningwebgl.com/blog/?p=684
			this.setAttribute("aTextureCoord", mesh.textureBuffer);		// This would be unnecessary with a 'cube-voxel' shader
			this.setIndexedAttribute(mesh.indexBuffer);
		}
});

// Block Prefab Creation Helpers

var adjustTextureCoords = function(textureArray, faceIndex, tileOffset, atlasSize) {
	var tileSize = atlasTileSize;
	var tilePadding = atlasPadding;
	for(var i = 8 * faceIndex, l = i + 8; i < l; i += 2) {
		textureArray[i] = (tileSize * (textureArray[i] + tileOffset[0]) + tilePadding * tileOffset[0])  / atlasSize[0];		// s
		var pixelsFromTop = tileSize * (tileOffset[1] + 1) + tilePadding * tileOffset[1];
		textureArray[i+1] = (tileSize * textureArray[i+1] + (atlasSize[1] - pixelsFromTop)) / atlasSize[1]; 	// t
	}
};

// End Block Prefab Creation Helpers

var atlasSize = [64, 64];
var atlasMaterial = Fury.Material.create({ shader: shader });
var atlasSrc = "expanded_atlas_upscaled.png";
var atlasPadding = 2;
var atlasTileSize = 16;

// TODO: Arguably should blend a nearest filtered texture with a mips textures
// based on fragement depth (but we need to figure out how to sample depth, oh no!)
// https://stackoverflow.com/questions/48601214/webgl-pixel-position-reconstruction-with-webgl-depth-texture
// https://blog.tojicode.com/2012/07/using-webgldepthtexture.html
// https://stackoverflow.com/questions/7327544/how-can-i-read-the-depth-buffer-in-webgl
// For now have upscaled the base texture by 8x

// Regeneration Variables and form details
var areaHeight = 1, areaExtents = 2;
var octaves = [], numOctaves = 4;
var octaveWeightings = [ 0.5, 0.5, 0.25, 0.1 ];
var perlin = true;
var seedString = "XUVNREAZOZJFPQMSAKEMSDJURTQPWEORHZMD";
var adjustmentFactor = 0.01;
var baseWavelength = 128;
var getGenerationVariables = function() {
	octaves.length = 0;
	octaveWeightings.length = 0;
	numOctaves = parseInt($("#octaves").val(),10);
	for(var i = 0; i < numOctaves; i++) {
		octaveWeightings.push(parseFloat($("#ow"+i).val()));
	}
	perlin = $("input[name='noiseType']:checked").val() == "Perlin";
	seedString = $("#seed").val();
	adjustmentFactor = parseFloat($("#adjust").val());
	baseWavelength = parseInt($("#baseWavelength").val(), 10);
	areaExtents = parseInt($("#extents").val(), 10);
	areaHeight = parseInt($("#height").val(), 10);
};

$(document).ready(function(){
	$("#octaves").change(function(event){
		$("#octavesDisplay").html(this.value);
		var html = "";
		for(var i = 0; i < this.value; i++) {
			var value = i < octaveWeightings.length ? octaveWeightings[i] : 1 / (1 + i);
			html += "<input id=\"ow"+i+"\" type=\"number\" value=\"" + value + "\" />";
		}
		$("#weightingsContainer").html(html);
	});
	$("#wavelengthPower").change(function(event){
		var power = parseInt(this.value, 10);
		$("#baseWavelength").val(Math.pow(2, power));
	});
	$("#regen").click(function(event){
		getGenerationVariables();
		clear();
		awake();
	});

	// Set initial values
	$("#octaves").val(numOctaves);
	var html = "";
	for(var i = 0; i < octaveWeightings.length; i++) {
		html += "<input id=\"ow"+i+"\" type=\"number\" value=\"" + octaveWeightings[i] + "\" />";
	}
	$("#weightingsContainer").html(html);
	$("#seed").val(seedString);
	$("#adjust").val(adjustmentFactor);
	$("#wavelengthPower").val(7);
	$("#baseWavelength").val(baseWavelength);
	$("#extents").val(areaExtents);
	$("#height").val(areaHeight);
});

// Create Camera & Scene
var rotateRate = Math.PI;
var zoomRate = 16;
var initalRotation = quat.create();
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 4/3, position: vec3.fromValues(0.0, 32.0, 128.0) });
var scene = Fury.Scene.create({ camera: camera });
var meshes = [];

var tileOffsets = {
	grass: {
		side: [1,0],
		top: [0,0],
		bottom: [0,1]
	},
	soil: {
		side: [0,1],
		top: [0,1],
		bottom: [0,1]
	},
	stone: {
		side: [1,1],
		top: [1,1],
		bottom: [1,1]
	}
};

var lastTime = Date.now();

var clear = function() {
	if(meshes.length > 0) {
		for(var i = 0, l = meshes.length; i < l; i++) {
			meshes[i].remove();
		}
		meshes.length = 0;
	}
};

var awake = function() {
	// Note this needs to happen after materials loaded so that when they are copied the textures have loaded.
	// Perhaps textures should be stored at the Fury (Fury.Engine) level and thus loading callbacks will provide the texture to all materials
	// who have that texture id and this will work even if they've been copied prior to texture load
	// More sensible would giving Fury this awake / update functionality so we don't need to write it each time.

	// Add Blocks to Scene

	// Use octaves where the octave integer is k you sample at x(2^k) and y(2^k) where 2^k is wavelength and naturally 1/(2^k) is frequency each octave needs a weighing

	// Divide by adjustmentFactor * (maxdepth + y) and adjust m as initial way to ensure air / ground distinction
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

	var createChunk = function(offset) {
		var maxDepth = 16, i, j, k, o, adjust;

		var chunk = {
			blocks: [],
			size: 32,
			addBlock: function(i,j,k,block) {
				this.blocks[i + this.size*j + this.size*this.size*k] = block;
			},
			getBlock: function(i,j,k) {
				if(i < 0 || j < 0 || k < 0 || i >= this.size || j >= this.size || k >= this.size) {
					return null;
				}
				return this.blocks[i + this.size*j + this.size*this.size*k];
			}
		};

		// Determine blocks from noise function
		for(i = 0; i < chunk.size; i++) {
			for(j = 0; j < chunk.size; j++) {
				y = j - Math.floor(chunk.size/2.0);
				for(k = 0; k < chunk.size; k++) {
					adjust = adjustmentFactor * (maxDepth + y + offset[1]);
					var value = 0;
					var totalWeight = 0;
					for(o = 0; o < numOctaves; o++) {
						var wavelength = Math.pow(2, o);
						totalWeight += octaveWeightings[o];
						value += octaveWeightings[o] * octaves[o].noise(wavelength*(i + offset[0])/baseWavelength, wavelength*(j + offset[1])/baseWavelength, wavelength*(k + offset[2])/baseWavelength);
					}
					value /= totalWeight;
					var block = getBlockType(value / adjust);
					chunk.addBlock(i,j,k,block)
				}
			}
		}

		return chunk;
	}

	for(var o = 0; o < numOctaves; o++) {
		octaves.push(perlin ? new ClassicalNoise(createSeed(seedString)) : new SimplexNoise(createSeed(seedString)));
	}

	var vorld = {
		chunkSize: 32,
		chunks: {},
		addChunk: function(chunk, i, j, k) {
			this.chunks[i+"_"+j+"_"+k] = chunk;
		},
		getChunk: function(i, j, k) {
			var key = i+"_"+j+"_"+k;
			if (this.chunks[key]) {
					return this.chunks[key];
			}
			return null;
		},
		getBlock: function(blockI, blockJ, blockK, chunkI, chunkJ, chunkK) {
			// Assumes you won't go out by more than chunkSize
			if (blockI >= this.chunkSize) {
				blockI = blockI - this.chunkSize;
				chunkI += 1;
			} else if (blockI < 0) {
				blockI = this.chunkSize + blockI;
				chunkI -= 1;
			}
			// Due to some madness chunk k is y axis, and chunk j is z axis...
			if (blockJ >= this.chunkSize) {
				blockJ = blockJ - this.chunkSize;
				chunkK += 1;
			} else if (blockJ < 0) {
				blockJ = this.chunkSize + blockJ;
				chunkK -= 1;
			}
			if (blockK >= this.chunkSize) {
				blockK = blockK - this.chunkSize;
				chunkJ += 1;
			} else if (blockK < 0) {
				blockK = this.chunkSize + blockK;
				chunkJ -= 1;
			}

			var chunk = this.getChunk(chunkI, chunkJ, chunkK);
			if (chunk) {
				// The lowest chunk seemed to be accessed 22000 times!?
				// TODO: Check wtf that is doing
				return chunk.getBlock(blockI, blockJ, blockK);
			}
			return null;
		}
	};

	// World Generation (Should WebWorker this)
	var chunkOffset = vec3.create();

	// Generate Chunks
	for(var i = -areaExtents; i <= areaExtents; i++) {
		for (var j = -areaExtents; j <= areaExtents; j++) {
			for(var k = areaHeight - 1; k >= 0; k--) {
				chunkOffset[0] = i * vorld.chunkSize;
				chunkOffset[1] = k * vorld.chunkSize;
				chunkOffset[2] = j * vorld.chunkSize;

				var chunk = createChunk(chunkOffset);
				vorld.addChunk(chunk, i, j, k);
			}
		}
	}

	// Create Meshes
	for(var i = -areaExtents; i <= areaExtents; i++) {
		for (var j = -areaExtents; j <= areaExtents; j++) {
			for(var k = areaHeight - 1; k >= 0; k--) {
				chunkOffset[0] = i * vorld.chunkSize;
				chunkOffset[1] = k * vorld.chunkSize;
				chunkOffset[2] = j * vorld.chunkSize;

				var mesh = buildMesh(vorld, i, j, k);
				var meshObject = scene.add({ mesh: Fury.Mesh.create(mesh), material: atlasMaterial });
				meshes.push(meshObject);
				vec3.add(meshObject.transform.position, meshObject.transform.position, chunkOffset);
			}
		}
	}

	loop();
};

var buildMesh = function(vorld, chunkI, chunkJ, chunkK) {
	var mesh = {
		vertices: [],
		normals: [],
		textureCoordinates: [],
		indices: []
	};

	var chunk = vorld.getChunk(chunkI, chunkJ, chunkK);

	forEachBlock(chunk, function(chunk, i, j, k, x, y, z) {
		var block = chunk.getBlock(i,j,k);

		// Exists?
		if(!block) { return; }

		if(block == "soil" && !vorld.getBlock(i, j+1, k, chunkI, chunkJ, chunkK)) {
			block = "grass";
		}
		// For Each Direction : Is Edge? Add quad to mesh!
		// Front
		if(!vorld.getBlock(i, j, k+1, chunkI, chunkJ, chunkK)) {
			addQuadToMesh(mesh, block, cubeFaces.front, x, y, z);
		}
		// Back
		if(!vorld.getBlock(i, j, k-1, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.back, x, y, z);
		}
		// Top
		if(!vorld.getBlock(i, j+1, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.top, x, y, z);
		}
		// Bottom
		if(!vorld.getBlock(i, j-1, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.bottom, x, y, z);
		}
		// Right
		if(!vorld.getBlock(i+1, j, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.right, x, y, z);
		}
		// Left
		if(!vorld.getBlock(i-1, j, k, chunkI, chunkJ, chunkK)){
			addQuadToMesh(mesh, block, cubeFaces.left, x, y, z);
		}
	});

	return mesh;
};

var addQuadToMesh = function(mesh, block, faceIndex, x, y, z) {
	var tile, offset, n = mesh.vertices.length/3;
	var vertices, normals, textureCoordinates;

	if(faceIndex == cubeFaces.top) {
		tile = tileOffsets[block].top;
	} else if (faceIndex == cubeFaces.bottom) {
		tile = tileOffsets[block].bottom;
	} else {
		tile = tileOffsets[block].side;
	}

	offset = faceIndex * 12;
	vertices = cubeJson.vertices.slice(offset, offset + 12);
	for(var i = 0; i < 4; i++) {
		vertices[3*i] = 0.5 * vertices[3*i] + x;
		vertices[3*i + 1] = 0.5 * vertices[3*i +1] + y;
		vertices[3*i + 2] = 0.5 * vertices[3*i + 2] + z;
	}

	normals = cubeJson.normals.slice(offset, offset + 12);

	offset = faceIndex * 8;
	textureCoordinates = cubeJson.textureCoordinates.slice(offset, offset + 8);
	adjustTextureCoords(textureCoordinates, 0, tile, atlasSize);

	concat(mesh.vertices, vertices);
	concat(mesh.normals, normals);
	concat(mesh.textureCoordinates, textureCoordinates);
	mesh.indices.push(n,n+1,n+2, n,n+2,n+3);
};

var concat = function(a, b) {
	// GC efficient concat
	for(var i = 0, l = b.length; i < l; i++) {
		a.push(b[i]);
	}
};

// delegate should be a function taking chunk, i, j, k, x, y, z
var forEachBlock = function(chunk, delegate) {
	for(i = 0; i < chunk.size; i++) {
		x = i - Math.floor(chunk.size/2.0);
		for(j = 0; j < chunk.size; j++) {
			y = j - Math.floor(chunk.size/2.0);
			for(k = 0; k < chunk.size; k++) {
				z = k - Math.floor(chunk.size/2.0);
				delegate(chunk, i, j, k, x, y, z);
			}
		}
	}
};

var framesInLastSecond = 0;
var timeSinceLastFrame = 0;

var loop = function(){
	var elapsed = Date.now() - lastTime;
	lastTime += elapsed;
	elapsed /= 1000;

	timeSinceLastFrame += elapsed;
	framesInLastSecond++;
	if(timeSinceLastFrame >= 1)
	{
		//console.log("FPS:" + framesInLastSecond);
		framesInLastSecond = 0;
		timeSinceLastFrame = 0;
	}
	handleInput(elapsed);
	scene.render();
	window.requestAnimationFrame(loop);
};

var localx = vec3.create();
var localz = vec3.create();
var unitx = vec3.fromValues(1,0,0);
var unity = vec3.fromValues(0,1,0);
var unitz = vec3.fromValues(0,0,1);
var prevX = 0;
var prevY = 0

var handleInput = function(elapsed) {
	var q = camera.rotation;
	var p = camera.position;
	vec3.transformQuat(localx, unitx, q);
	vec3.transformQuat(localz, unitz, q);

	var mousePos = Input.MousePosition;
	var deltaX = mousePos[0] - prevX;
	var deltaY = mousePos[1] - prevY;
	prevX = mousePos[0];
	prevY = mousePos[1];

	if (Input.mouseDown(2)) {
		quat.rotate(q, q, -0.1*deltaX*rotateRate*elapsed, unity);
		quat.rotateX(q, q, -0.1*deltaY*rotateRate*elapsed);
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
	var texture = Fury.Renderer.createTexture(image, "pixel", true);
	atlasMaterial.textures["uSampler"] = texture;
	awake();
};
image.src = atlasSrc;
