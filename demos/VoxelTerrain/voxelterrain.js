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
// Note each cube type needs to have its own mesh with adjusted texture coordinates
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
	for(var i = 8 * faceIndex, l = i + 8; i < l; i += 2) {
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
		if(i == cubeFaces.top) {
			adjustTextureCoords(adjustedCube.textureCoordinates, i, topTile, atlasSize);
		} else if (i == cubeFaces.bottom) {
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

// Regeneration Variables and form details
var octaves = [], numOctaves = 4;
var octaveWeightings = [ 0.5, 0.5, 0.25, 0.1 ];
var perlin = true;
var seedString = "XUVNREAZOZJFPQMSAKEMSDJURTQPWEORHZMD";
var adjustmentFactor = 0.01;
var baseWavelength = 64;
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

	// TODO: Should also really set the range over which the 1st octave works (aka Wavelength) settable, as having only 64 means anything more than 4 ovctaves just ends up messy.

	// Set initial values
	$("#octaves").val(numOctaves);
	var html = "";
	for(var i = 0; i < octaveWeightings.length; i++) {
		html += "<input id=\"ow"+i+"\" type=\"number\" value=\"" + octaveWeightings[i] + "\" />";
	}
	$("#weightingsContainer").html(html);
	$("#seed").val(seedString);
	$("#adjust").val(adjustmentFactor);
	$("#baseWavelength").val(baseWavelength);
});

var chunkBuildingMethod = {
	prefabs: 0,
	singleMesh: 1,
	singleOptimisedMesh: 2
};
var selectedBuildingMethod = chunkBuildingMethod.singleMesh;

// Create Camera & Scene 
var rotateRate = Math.PI;
var zoomRate = 16;	
var initalRotation = quat.create();
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 4/3, position: vec3.fromValues(0.0, 32.0, 128.0) });	
var scene = Fury.Scene.create({ camera: camera });
var blocks = [];
var bigMeshObject = null;

createBlockPrefab("grass", atlasMaterial, [1,0], [0,0], [0,1]); // Arrays: Side, Top, Bottom
createBlockPrefab("soil", atlasMaterial, [0,1], [0,1], [0,1]);
createBlockPrefab("stone", atlasMaterial, [1,1], [1,1], [1,1]);

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
	if(bigMeshObject) {
		bigMeshObject.remove();
	}
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

	var maxDepth = 32, x, y, z, i, j, k, o, adjust;
	var scale = vec3.fromValues(0.5,0.5,0.5);
	var chunk = { 
		blocks: [],
		size: 64,
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

	for(o = 0; o < numOctaves; o++) {
		// TODO: Flag for Simpelx versus Classical Noise
		octaves.push(perlin ? new ClassicalNoise(createSeed(seedString)) : new SimplexNoise(createSeed(seedString)));
	}

	// Determine block from noise function
	for(i = 0; i < chunk.size; i++) {
		for(j = 0; j < chunk.size; j++) {
			y = j - Math.floor(chunk.size/2.0);
			for(k = 0; k < chunk.size; k++) {
				adjust = adjustmentFactor * (maxDepth + y);
				var value = 0;
				var totalWeight = 0;
				for(o = 0; o < numOctaves; o++) {
					var wavelength = Math.pow(2, o);
					totalWeight += octaveWeightings[o];
					value += octaveWeightings[o] * octaves[o].noise(wavelength*i/baseWavelength, wavelength*j/baseWavelength, wavelength*k/baseWavelength);
				}
				value /= totalWeight;
				var block = getBlockType(value / adjust);
				chunk.addBlock(i,j,k,block)
			}
		}
	}

	switch(selectedBuildingMethod)
	{
		case chunkBuildingMethod.singleMesh:
			var mesh = {
				vertices: [],
				normals: [],
				textureCoordinates: [],
				indices: []
			};
			forEachBlock(chunk, function(chunk, i, j, k, x, y, z) {
				var block = chunk.getBlock(i,j,k);
				
				// Exists?
				if(!block) { return; }
				if(block == "soil" && !chunk.getBlock(i,j+1,k)) {
					block = "grass";
				}
				// For Each Direction : Is Edge? Add quad to mesh!			
				// Front
				if(!chunk.getBlock(i,j,k+1)) {
					addQuadToMesh(mesh, block, cubeFaces.front, x, y, z);
				}
				// Back
				if(!chunk.getBlock(i,j,k-1)){
					addQuadToMesh(mesh, block, cubeFaces.back, x, y, z);
				}
				// Top
				if(!chunk.getBlock(i,j+1,k)){
					addQuadToMesh(mesh, block, cubeFaces.top, x, y, z);
				}
				// Bottom
				if(!chunk.getBlock(i,j-1,k)){
					addQuadToMesh(mesh, block, cubeFaces.bottom, x, y, z);
				}
				// Right
				if(!chunk.getBlock(i+1,j,k)){
					addQuadToMesh(mesh, block, cubeFaces.right, x, y, z);
				}
				// Left
				if(!chunk.getBlock(i-1,j,k)){
					addQuadToMesh(mesh, block, cubeFaces.left, x, y, z);
				}
			});
			bigMeshObject = scene.add({ mesh: Fury.Mesh.create(mesh), material: atlasMaterial });
			break;
		case chunkBuildingMethod.prefabs:
		default:
			// Spawn just blocks on an edge
			// Technically we should be itterating over chunks in a separate function, but you know get it working for a single chunk first
			forEachBlock(chunk, function(chunk, i, j, k, x, y, z) {
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
			});
			break;
	}
	loop();
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
}

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
		console.log("FPS:" + framesInLastSecond);
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



