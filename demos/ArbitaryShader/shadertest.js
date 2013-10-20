// This is to test the basic rendering functions of Fury
// without any extra stuff (e.g. loading shaders and images from URIs, using an explicit scene, etc)

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

// Create Texture (image on page with id texture)
var texture = r.createTexture(document.getElementById('texture'), "medium"); // Investigate the errors recieved with "high"
var vs = r.createShader("vertex", vsSource);
var fs = r.createShader("fragment", fsSource);
var shaderProgram = r.createShaderProgram(vs, fs);	// Couldn't this be one lined pretty simply? pass vsSource and fsSource into createShaderProgram... are we ever going to need vs or fs? We can always attach it to the shaderProgram anyway

// Setup Shader
r.initAttribute(shaderProgram, "aVertexPosition");
r.initAttribute(shaderProgram, "aTextureCoordinates");
r.initUniform(shaderProgram, "modelViewMatrix"); // mat4
r.initUniform(shaderProgram, "projectionMatrix"); //mat4
r.initUniform(shaderProgram, "time"); // float
r.initUniform(shaderProgram, "mouse"); // vec2
r.initUniform(shaderProgram, "mouseLeft"); // int
//r.initUniform(shaderProgram, "tex0"); // sampler2D	TODO: Check this..

// Create Geometry


// Loop
	// Bind Shader
	// Draw