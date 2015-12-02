// https://ace.c9.io/#nav=howto
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/glsl");

// Init
Fury.init('fury');
var r = Fury.Renderer;

// Create Buffers
var quadBuffer = r.createBuffer([
		1.0,	1.0,	0.0,
		-1.0,	1.0,	0.0,
		1.0,	-1.0,	0.0,
		-1.0,	-1.0,	0.0
	], 3);
var textureBuffer = r.createBuffer([
		1.0,	1.0,
		0.0,	1.0,
		1.0,	0.0,
		0.0,	0.0
	], 2);

// Shader Source
var vsSource = [ "attribute vec3 aVertexPosition;",
	"attribute vec2 aTextureCoordinates;",
	"uniform mat4 modelViewMatrix;",
	"uniform mat4 projectionMatrix;",
	"varying vec2 vTextureCoordinates;",
	"varying vec2 pos;",
	"void main() { ",
		"vTextureCoordinates = aTextureCoordinates;",
		"gl_Position = projectionMatrix * modelViewMatrix * vec4(aVertexPosition, 1.0);",
		"pos = vec2(aVertexPosition.x, aVertexPosition.y);",
	"}"].join("\n");
var fsSource = editor.getValue();

editor.getSession().on("change", function(e){
	fsSource = editor.getValue();
	setupShaderProgram();
});


// Setup Shader Code
var bindShaderProperties = function(){
	// Bind Shader properties that do no change
	r.enableAttribute("aVertexPosition");
	r.enableAttribute("aTextureCoordinates");
	r.setAttribute("aVertexPosition", quadBuffer);
	r.setAttribute("aTextureCoordinates", textureBuffer);
	r.setUniformMatrix4("modelViewMatrix", modelViewMatrix);
	r.setUniformMatrix4("projectionMatrix", projectionMatrix);
}

var bindEvents = function(){
	// Events!
	$('#fury').keydown(function(event) {
		event.preventDefault();
		var key = event.which;
	});

	$('#fury').mousemove(function(event) {
		event.preventDefault();
		// transforming cursor coordinates to [-1.0, 1.0] range
		// [0,0] being in the left bottom corner to match the vertex coordinates
		var x = (event.pageX / 512)*2.0 - 1.0;
		var y = 0.0 - ((event.pageY / 512)*2.0 - 1.0);
		r.setUniformFloat2("mouse", x, y);
	});

	$('#fury').mousedown(function(event) {
		event.preventDefault();
		var key = event.which;
		var x = event.pageX;
		var y = event.pageY;
		if (key==1) {
			r.setUniformBoolean("mouseLeft", true);
		}
	});

	$('#fury').mouseup(function(event) {
		event.preventDefault();
		var key = event.which;
		if (key==1) {
			r.setUniformBoolean("mouseLeft", false);
		}
	});

	$('#fury').mouseleave(function(event) {
		event.preventDefault();
		r.setUniformFloat2("mouse", 0, 0);
	});
}

var setupShaderProgram = function() {
	try
	{	
		var vs = r.createShader("vertex", vsSource);
		var fs = r.createShader("fragment", fsSource);
		var shaderProgram = r.createShaderProgram(vs, fs);

		r.initAttribute(shaderProgram, "aVertexPosition");
		r.initAttribute(shaderProgram, "aTextureCoordinates");
		r.initUniform(shaderProgram, "modelViewMatrix"); // mat4
		r.initUniform(shaderProgram, "projectionMatrix"); //mat4
		r.initUniform(shaderProgram, "time"); // float
		r.initUniform(shaderProgram, "mouse"); // vec2
		r.initUniform(shaderProgram, "mouseLeft"); // bool
		r.initUniform(shaderProgram, "tex0"); // sampler

		r.useShaderProgram(shaderProgram);	

		// r.deleteShader(vsSource);
		// r.deleteShader(fsSource);
		// ^^ Question: Is this a good idea? Why would you do it?
		bindShaderProperties();
		bindEvents();

		r.setTexture(0, texture);
		r.setUniformInteger("tex0", 0);
	}
	catch (error)
	{

	}
}

// Camera
var camera = Fury.Camera.create({
	type: "Orthonormal",
	near: 0.1,
	far: 100.0,
	height: 2.0
});

var projectionMatrix = mat4.create(), modelViewMatrix = mat4.create();
camera.getProjectionMatrix(projectionMatrix);
mat4.identity(modelViewMatrix);
mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -2.0]);


// Loop
var time = Date.now(), runningTime = 0, delta = 0;

setupShaderProgram();


var loop = function(){
	delta = Date.now() - time;
	time += delta;
	runningTime += delta;
	r.setUniformFloat("time", runningTime/1000);
	r.clear();
	r.drawTriangleStrip(quadBuffer.numItems);
	window.requestAnimationFrame(loop);
};

// Create Texture 
// This is a bit syntaxically messy
var texture, image = new Image();
image.onload = function() {
	texture = r.createTexture(image, "high");
	r.setTexture(0, texture); 	// Note don't actually need to set tex0 uniform to 0, unlike in WebGL playground demo code
	loop();
};
image.src = "concrete1.jpg";