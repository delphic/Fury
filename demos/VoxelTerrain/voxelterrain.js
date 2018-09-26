// Voxel Terrain Generator
// Multiple Octaves of Perlin Noise -> Cubes

// glMatrix extension
quat.rotate = (function() {
	var i = quat.create();
	return function(out, q, rad, axis) {
		quat.setAxisAngle(i, axis, rad);
		return quat.multiply(out, i, q);
	}
})();

var updateCanvasSize = function() {
	// Remove any scaling of width / height as a result of using CSS to size the canvas
	var glCanvas = document.getElementById("fury");
	glCanvas.width = glCanvas.clientWidth;
	glCanvas.height = glCanvas.clientHeight;
}
$(window).resize(function(){
	updateCanvasSize();
});
updateCanvasSize();

Fury.init("fury");
var Input = Fury.Input;

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
			this.setAttribute("aVertexPosition", mesh.vertexBuffer);
			this.setAttribute("aTextureCoord", mesh.textureBuffer);		// This would be unnecessary with a 'cube-voxel' shader
			this.setIndexedAttribute(mesh.indexBuffer);
		}
});

var atlasMaterial = Fury.Material.create({ shader: shader });
var atlasSrc = "expanded_atlas_upscaled.png";
// Use upscaled texture to allow for reasonable resolution closeup
// when using mipmaps to prevent artifacts at distance.

// Regeneration Variables and form details
var areaHeight = 2, areaExtents = 3;
var octaves = [], numOctaves = 4;
var octaveWeightings = [ 0.5, 0.5, 1, 0.1 ];
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
	$("#showGenerationForm").click(function() {
		$("#generationForm").show();
		$("#showGenerationForm").hide();
	});
	$("#hideGenerationForm").click(function() {
		$("#generationForm").hide();
		$("#showGenerationForm").show();
	});
	$("#hideControls").click(function() {
		$("#controls").hide();
	});
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
		$("#generationForm").hide();
		$("#showGenerationForm").show();
		$("#progressDisplay").show();
		$("#generationParameters").hide();

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
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: 4/3, position: vec3.fromValues(53.0, 55.0, 123.0), rotation: quat.fromValues(-0.232, 0.24, 0.06, 0.94) });
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
	$("#progressStage").html("Generating Voxel Data");
	$("#progressBarInner").width("0%");

	var generator = new Worker('generator.js');
	generator.onmessage = function(e) {
		if (e.data.stage) {
			$("#progressStage").html(e.data.stage);
		}

		if (e.data.progress != undefined) {
			$("#progressBarInner").width((e.data.progress * 100) + "%");
		}

		if (e.data.complete) {
			generateMeshes(e.data.vorld);
		}
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

var generateMeshes = function(vorld) {
	$("#progressStage").html("Generating Meshes");
	$("#progressBarInner").width("0%");

	var mesher = new Worker('mesher.js');
	mesher.onmessage = function(e) {
		if (e.data.mesh) {
			var meshObject = scene.add({ mesh: Fury.Mesh.create(e.data.mesh), material: atlasMaterial });
			vec3.add(meshObject.transform.position, meshObject.transform.position, vec3.clone(e.data.offset));
			meshes.push(meshObject);
		}
		if (e.data.progress != undefined) {
			$("#progressBarInner").width((e.data.progress * 100) + "%");
		}
		if (e.data.complete) {
			$("#progressDisplay").hide();
			$("#generationParameters").show();
		}
	};
	mesher.postMessage({
		areaExtents: areaExtents,
		areaHeight: areaHeight,
		chunkData: vorld
	});
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
		// This is where you'd set the value in an FPS counter, if there was one
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
