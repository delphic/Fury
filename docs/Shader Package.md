# Shader Package / Interface Thoughts

Each shader is given by a single .js file which can be imported on build. The JS file needs to contain:
* The GLSL Source
* Array of Attributes Names & Binding Functions
* Array of Uniform Names & Binding Functions
* Array of Uniform Array Names, Length & Binding Function

Question: Whilst providing the bind function might make our life slightly easier (don't have to remember the gl function to call), it doesn't solve the fundamental problem of requiring different data for each shader and having to retrieve it from somewhere. Because this has to be standardised is there any real benefit to this... there's no real decoupling, the structure of the bind function is always going to be strongly couple to the representation of data in the engine. We can specify how this data is stored and try not to vary it... but I don't think there's anyway around this.

The Real Question: Do we prefer this coupling in the shader setup code or in the renderer? The former I think, so are we justing to pass an object containing everything (bad, GC! Unless these objects are stored) or pass many args (then there's a dependency on the order we pass the data, arguably might as well be an object).

Structure of Render Object:
{
	vertexPositionBuffer: #,
	vertexNormalBuffer: #,
	vertexIndexBuffer: #,
	textureCoordinateBuffer: #,
	// Camera Matrices (MV / MVN / P) can be dealt with in the engine
	// Uniforms
}

Wait... why are putting in this layer? Why don't we just pass attribute names and uniform names + data? I.e.
{
	Attributes: { name: value, ... },
	Uniforms: { name: value, ... },
	UniformArrays: { name: { value: value, length: length }, ... }
}
So pretty much how the shader was specified but with values instead of bind functions.

This is all very nice, but it's quite literal, we may have to redesign when we try to optimise (e.g. geometry instances, grouping by texture) rather than just binding everything, everytime, every object. Let's cross that bridge when we come to it eh?

Also are we not giving attributes the extra specialness they deserve? Whilst just referencing by name is all very good and generic, the concept of vertex / normals / texture Coords are pretty static. Let's go with the generic and see how it goes, I have a hunch separating them from attributes is sufficient distinction.  


## Which Shaders and How to configure?

Which shaders should we initially include? How many lights do we support (Source doesn't do more than 4) (non-deferred)? 

THREE.js & Unity uses materials to specify shader (well unity defo does), in three it chooses to displaying normals / change lighting types (Lamber, Phong), requires investigation to see if it determines shader from material, probably does though, especially given "ShaderMaterial". We should likely emulate, then the material can pass through to the configuration how to specify the various uniforms / attributes, this is where a GUI / game editor would be ideal, keep this in mind when designing, however for now we want a flexible system that should allow us to quickly experiment with shaders.

Start with a textured pixel lit, limit to ambient + directional lights for now (i.e. the ZeroG shader with spot and point lights removed.)

### The Basic Shaders

* Pixel Lit Textured
* Pixel Lit Coloured
* Pixel Lit Tinted Textured
* Mesh Normals
* (Coloured) Wireframe
* (Coloured) Point Cloud 

### Some more advanced Shaders

* Specular 
* Specular Map
* Bump/Normal Map

