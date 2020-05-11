"use strict";
var vec3 = window.vec3;
var quat = window.quat;
var $ = window.$;
var Fury = window.Fury;
var VorldConfig = window.VorldConfig;
var VoxelShader = window.VoxelShader;

// Voxel Terrain Generator
// Multiple Octaves of Perlin Noise -> Cubes

// glMatrix extension
quat.rotate = (function() {
	var i = quat.create();
	return function(out, q, rad, axis) {
		quat.setAxisAngle(i, axis, rad);
		return quat.multiply(out, i, q);
	};
})();

var resolutionFactor = 1; // Lower this for low-spec devices
var cameraRatio = 16 / 9;
var updateCanvasSize = function() {
	// Remove any scaling of width / height as a result of using CSS to size the canvas
	var glCanvas = document.getElementById("fury");
	glCanvas.width = resolutionFactor * glCanvas.clientWidth;
	glCanvas.height = resolutionFactor * glCanvas.clientHeight;
	cameraRatio = glCanvas.clientWidth / glCanvas.clientHeight;
	if (camera && camera.ratio) {
    	camera.ratio = cameraRatio;
	}
};
$(window).resize(function(){
	updateCanvasSize();
});
updateCanvasSize();

Fury.init("fury");
var Input = Fury.Input;

var atlas = VorldConfig.getAtlasInfo();
var shader = Fury.Shader.create(VoxelShader.create(atlas));

var atlasMaterial = Fury.Material.create({ shader: shader });
var atlasSrc = "expanded_atlas_upscaled.png";
// Use upscaled texture to allow for reasonable resolution closeup
// when using mipmaps to prevent artifacts at distance.

// TODO: Ideally take minimal sized atlas with no padding then use canvas2D
// to generate atlas upscaled + padded as demanded by atlas config

// Regeneration Variables and form details
var neutralNoise = true; // Is noise between -0.5 and +0.5 or between 0 and 1
var areaHeight = 2, areaExtents = 3;
var octaves = [], numOctaves = 4;
var octaveWeightings = [ 0.5, 0.5, 1, 0.1 ];
var perlin = true;
var seedString = "XUVNREAZOZJFPQMSAKEMSDJURTQPWEORHZMD";

var shapingFunction = "inverse_y";
var adjustmentFactor = 0.01, yOffset = 0; // Shaping Function
var amplitude = 64, sdx = 64, sdz = 64, yDenominator = 16.0;

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
    neutralNoise = $("#neutralNoise").val() == "neutral";
	
	baseWavelength = parseInt($("#baseWavelength").val(), 10);
	areaExtents = parseInt($("#extents").val(), 10);
	areaHeight = parseInt($("#height").val(), 10);
	
	shapingFunction = $("#shapingFunction").val();
	if (shapingFunction == "inverse_y") {
	    yOffset = parseFloat($("#yOffset").val());
    	adjustmentFactor = 1 / parseFloat($("#adjust").val());  // TODO: Change the internal function to m / (y + offset)
	} else if (shapingFunction == "negative_y") {
    	yOffset = parseFloat($("#yOffset_n").val());
    	yDenominator = parseFloat($("#yDenominator_n").val());
	} else if (shapingFunction == "gaussian") {
	    yDenominator = parseFloat($("#yDenominator_g").val());
    	amplitude = parseFloat($("#amplitude").val());
    	sdx = parseFloat($("#sdx").val());
    	sdz = parseFloat($("#sdz").val());
	}
};

var setParameterVisibility = function(shapingFunction) {
    switch(shapingFunction){
        case "inverse_y":
            $("#inverse_y").show();
            $("#negative_y").hide();
            $("#gaussian").hide();
            break;
        case "negative_y":
            $("#inverse_y").hide();
            $("#negative_y").show();
            $("#gaussian").hide();
            break;
        case "gaussian":
            $("#inverse_y").hide();
            $("#negative_y").hide();
            $("#gaussian").show();
            break;
        default:
            $("#inverse_y").hide();
            $("#negative_y").hide();
            $("#gaussian").hide();
            break;
    }
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
	$("#shapingFunction").change(function(event){
	    setParameterVisibility(this.value);
	});
	

	// Set initial values
	$("#octaves").val(numOctaves);
	var html = "";
	for(var i = 0; i < octaveWeightings.length; i++) {
		html += "<input id=\"ow"+i+"\" type=\"number\" value=\"" + octaveWeightings[i] + "\" />";
	}
	$("#weightingsContainer").html(html);
	$("#seed").val(seedString);
	
    $("#neutralNoise").val(neutralNoise ? "netural": "sane");
	
	$("#wavelengthPower").val(7);
	$("#baseWavelength").val(baseWavelength);
	$("#extents").val(areaExtents);
	$("#height").val(areaHeight);
	
	$("#shapingFunction").val(shapingFunction);
	setParameterVisibility(shapingFunction);
	$("#yOffset").val(yOffset);
	$("#adjust").val(100);
	
	$("#yOffset_n").val(32);
	$("#yDenominator_n").val(16);
	
	$("#yDenominator_g").val(yDenominator);
	$("#amplitude").val(amplitude);
	$("#sdx").val(sdx);
	$("#sdz").val(sdz);
});

// Create Camera & Scene
var rotateRate = 0.1 * Math.PI, maxRotatePerFrame = 0.2 * rotateRate;
var zoomRate = 16;
var initalRotation = quat.create();
var camera = Fury.Camera.create({ near: 0.1, far: 1000000.0, fov: 45.0, ratio: cameraRatio, position: vec3.fromValues(53.0, 55.0, 123.0), rotation: quat.fromValues(-0.232, 0.24, 0.06, 0.94) });
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

		if (e.data.progress !== undefined) {
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
		shapingFunction: shapingFunction,
		adjustmentFactor: adjustmentFactor,
		yOffset: yOffset,
		amplitude: amplitude,
		sdx: sdx,
		sdz: sdz,
		yDenominator: yDenominator,
		neutralNoise: neutralNoise
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
		if (e.data.progress !== undefined) {
			$("#progressBarInner").width((e.data.progress * 100) + "%");
		}
		if (e.data.complete) {
			$("#progressDisplay").hide();
			$("#generationParameters").show();
		}
	};
	mesher.postMessage({
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
var prevY = 0;

// https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
var getRoll = function(q) {
    // Note: glMatrix is x,y,z,w where as wiki assumes w,x,y,z!
    let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
    let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
    return Math.atan(sinr_cosp / cosr_cosp);
    // If you want to know sector you need atan2(sinr_cosp, cosr_cosp)
    // but we don't in this case.
};

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
	    let xRotation = deltaX*rotateRate*elapsed;
	    if (Math.abs(xRotation) > maxRotatePerFrame) {
            xRotation = Math.sign(xRotation) * maxRotatePerFrame;
	    }
	    let yRotation = deltaY*rotateRate*elapsed;
	    if (Math.abs(yRotation) > maxRotatePerFrame) {
	        yRotation = Math.sign(yRotation) * maxRotatePerFrame;
	    }
		quat.rotate(q, q, -xRotation, unity);

		let roll = getRoll(q);
		let clampAngle = 10 * Math.PI/180;
	    if (Math.sign(roll) == Math.sign(yRotation) || Math.abs(roll - yRotation) < 0.5*Math.PI - clampAngle) {
    		quat.rotateX(q, q, -yRotation);
	    }
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
