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

Fury.init("fury");
var Input = Fury.Input;

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

var atlasMaterial = Fury.Material.create({ shader: shader });
var atlasSrc = "expanded_atlas_upscaled.png";

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
		generateVorld();
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
	generateVorld();
	loop();
};

var generateVorld = function() {
	var generator = new Worker('generator.js');
	generator.onmessage = function(e) {
		// TODO: Manage Chunk Generation Update Events
		var meshObject = scene.add({ mesh: Fury.Mesh.create(e.data.mesh), material: atlasMaterial });
		vec3.add(meshObject.transform.position, meshObject.transform.position, vec3.clone(e.data.offset));
		meshes.push(meshObject);
	};

	generator.postMessage({
		seed: seedString,
		numOctaves: numOctaves,
		octaveWeightings: octaveWeightings,
		perlin: perlin,
		baseWavelength: baseWavelength,
		areaExtents: areaExtents,
		areaHeight: areaHeight,
		adjustmentFactor: adjustmentFactor
	});
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
