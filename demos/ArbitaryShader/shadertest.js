// This is to test the basic rendering functions of Fury
// without any extra stuff (e.g. loading shaders and images from URIs, using an explicit scene, etc)

// This is an attempt to recreate http://webglplayground.net/?template=webgl1 but with Fury instead

// Shader Source
var vsSource = [ "attribute vec3 aVertexPosition;"
+ "attribute vec2 aTextureCoordinates;"
+ "uniform mat4 modelViewMatrix;"
+ "uniform mat4 projectionMatrix;"
+ "varying vec2 vTextureCoordinates;"
+ "varying vec2 pos;"
+ "void main() { "
+ "vTextureCoordinates = aTextureCoordinates;"
+ "gl_Position = projectionMatrix * modelViewMatrix * vec4(aVertexPosition, 1.0);"
+ "pos = vec2(aVertexPosition.x, aVertexPosition.y);"
+ "}"].join("\n");
var fsSource = [ "precision highp float;"	// Investigate Shader Compile Errors when this is wrapped in #ifdef GL_ES ... #endif
+ "varying vec2 vTextureCoordinates;"
+ "varying vec2 pos;"
+ "uniform float time;"
+ "uniform vec2 mouse;"
+ "uniform int mouseLeft;"
+ "uniform sampler2D tex0;"
+ "void main() {"
	+ "float v1 = (sin(vTextureCoordinates.s+time) + 1.0) / 2.0;"
	+ "float v2 = (cos(vTextureCoordinates.t+time) + 1.0) / 2.0;"
	+ "float d = distance(mouse, pos);"
	+ "vec2 tt = vec2(vTextureCoordinates.s+sin(time/10.0), vTextureCoordinates.t+cos(time/10.0));"
	+ "vec4 c1 = texture2D(tex0, tt) * 1.1;"
	+ "float avg = (c1.r+c1.g+c1.b)/3.0;"
	+ "float r = c1.r+v1*pow(avg,4.0) - pow(d,pow(avg,2.0) +float(mouseLeft)*avg);"
	+ "float g = c1.g+v2*pow(avg,4.0) - pow(d,pow(avg,2.0) +float(mouseLeft)*avg);"
	+ "float b = c1.g - pow(d,pow(avg,2.0) +float(mouseLeft)*avg);"
	+ "gl_FragColor = vec4(r, g, b, 1.0);"
+ "}" ].join("\n");

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

// Setup Shader
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

r.useShaderProgram(shaderProgram); 

// Camera
var camera = Fury.Camera.create({ 
	type: "Orthonormal",
	near: 0.1,
	far: 100.0,
	height: 2.0
});

var projectionMatrix = mat4.create(), modelViewMatrix = mat4.create();
camera.getProjectionMatrix(projectionMatrix, 1.0);
mat4.identity(modelViewMatrix);
mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -2.0]);

// Events!
$(document).keydown( function(event) {
  event.preventDefault();
  var key = event.which;
});

$(document).mousemove( function(event) {
  event.preventDefault();
  // transforming cursor coordinates to [-1.0, 1.0] range
  // [0,0] being in the left bottom corner to match the vertex coordinates
  var x = (event.pageX / 512)*2.0 - 1.0;
  var y = 0.0 - ((event.pageY / 512)*2.0 - 1.0);
  r.setUniformFloat2("mouse", x, y);
});

$(document).mousedown( function(event) {
  event.preventDefault();
  var key = event.which;
  var x = event.pageX;
  var y = event.pageY;
  if (key==1) {
	r.setUniformBoolean("mouseLeft", true);
  }
});

$(document).mouseup( function(event) {
  event.preventDefault();
  var key = event.which;
  if (key==1) {
	r.setUniformBoolean("mouseLeft", false);
  }
});

$(document).mouseleave( function(event) {
  event.preventDefault();
  r.setUniformFloat2("mouse", 0, 0);
});

// Loop
var time = Date.now(), runningTime = 0, delta = 0;

// Bind Shader properties that do no change
r.enableAttribute("aVertexPosition");
r.enableAttribute("aTextureCoordinates");
r.setAttribute("aVertexPosition", quadBuffer);
r.setAttribute("aTextureCoordinates", textureBuffer);
r.setUniformMatrix4("modelViewMatrix", modelViewMatrix);
r.setUniformMatrix4("projectionMatrix", projectionMatrix);	


var loop = function(){
	delta = Date.now() - time; 
	time += delta;
	runningTime += delta;
	r.setUniformFloat("time", runningTime/1000);
	r.clear();
	r.drawTriangleStrip(quadBuffer.numItems);
	setTimeout(loop, 1); // TODO: Use Request Animation Frame
};

// Create Texture 
// This is a bit syntaxically messy
var texture, image = new Image();
image.onload = function() {
	texture = r.createTexture(image, "high");
	r.setTexture(texture); 	// Note, no uniform location and binding required for texture, unlike example on WebGL Playground
	loop();
};
image.src = "concrete1.jpg";

