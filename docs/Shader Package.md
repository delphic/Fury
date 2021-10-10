# Shader Package / Interface Thoughts

Each shader is given by a single .js file which can be imported on build. The JS file needs to contain:
* The GLSL Source
* Array of Attributes Names & Binding Functions
* Array of Uniform Names & Binding Functions
* Array of Uniform Array Names, Length & Binding Function

Question: Whilst providing the bind function might make our life slightly easier (don't have to remember the gl function to call), it doesn't solve the fundamental problem of requiring different data for each shader and having to retrieve it from somewhere. Because this has to be standardised is there any real benefit to this... there's no real decoupling, the structure of the bind function is always going to be strongly couple to the representation of data in the engine. We can specify how this data is stored and try not to vary it... but I don't think there's anyway around this.

The Real Question: Do we prefer this coupling in the shader setup code or in the renderer? The former I think, so are we just going to pass an object containing everything (bad, GC! Unless these objects are stored) or pass many args (then there's a dependency on the order we pass the data, arguably might as well be an object).

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
> Update - this isn't practical as the structure of the render object should be uniform across different shaders, so the first one should work better and other custom uniforms will need to be event / material driven for bindings

This is all very nice, but it's quite literal, we may have to redesign when we try to optimise (e.g. geometry instances, grouping by texture) rather than just binding everything, every time, every object. Let's cross that bridge when we come to it eh?

Also are we not giving attributes the extra specialness they deserve? Whilst just referencing by name is all very good and generic, the concept of vertex / normals / texture coords are pretty static. Let's go with the generic and see how it goes, I have a hunch separating them from attributes is sufficient distinction.


## Which Shaders and How to configure?

Which shaders should we initially include? How many lights do we support (Source doesn't do more than 4) (non-deferred)?

THREE.js & Unity uses materials to specify shader (well unity definitely does), in three it chooses to displaying normals / change lighting types (Lamber, Phong), requires investigation to see if it determines shader from material, probably does though, especially given "ShaderMaterial". We should likely emulate, then the material can pass through to the configuration how to specify the various uniforms / attributes, this is where a GUI / game editor would be ideal, keep this in mind when designing, however for now we want a flexible system that should allow us to quickly experiment with shaders.

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

## Thoughts after implementing test shader

An error which I ran into was I was using the wrong bind function (float) instead of integer, ideally the wrapping / shader setup binding code that I place on top of the basic gl wrapper will either prevent or warn when this happens. Worth noting that the WebGL error reported that I was using uniform1fv when I had actually called uniform1f. So there is a WebGL error in this case even if it can be slightly misleading, so perhaps this isn't a massive priority

Example project sets the texture uniform to 0, but it seems not to be necessary to initialise or bind this uniform, just making sure the active texture is the correct WebGL texture seems to be sufficient.

Shader Programs could arguably be made in a single line by passing the shader sources rather than the created shaders themselves

## Second Pass of thoughts on Shader specification and binding functions

Lets start with the motivation, in my first WebGL project everytime I loaded a new shader I had to update my "RenderObject" function and it ended up as a massive number of conditionals that tried to handle all my shaders at once, not very extensible! The other thing is I'd like to actually try only re-binding the uniforms / attributes as necessary (or at least as close as is feasible to the most efficient route) rather than every single time I render an instance of anything.

So the original proposal was to have shaders specified as a js file. This would include the data (source, a list of attribute names / uniform names) but it would also include several functions which could be called by the renderer which when passing in a standardised 'render object' would set up the shader for that object. Now the coupling of the engine / renderers logic for what a 'render object' is and the shader is in the shader file, not in the renderer, much preferable.

However to avoid GC we can't pass in different versions of the render object to get the shader to only re-bind the bits we want. My current thinking is we cut down the rebinds (although don't get optimal) by separating the bindings / updates into groups (which are listed in roughly the order from outside to inside of loops running over them), each would have a corresponding function(s):

1. Those that need to be changed once a frame, e.g. time, time delta, possibly projection matrix (although this might need to be separate for flexibility)
2. Those that need to be changed per set of instances using the same textures - textures, maybe some tint colours (Q: this is the material?)
3. Those that need to be changed once per set of instances, e.g. vertex buffers / normal buffers / texture coord buffers etc (Q: this is the mesh?)
4. Those that need to be changed per instance, e.g. mvMatrix    (Q: this is the instance?)
5. Those which can be event driven / are material based, e.g. custom uniforms like "mousePosition", "mouseDown", (?)"Colour"

There are some interesting questions on 5 on how to deal with multiple objects using the same Shader / Material, Unity takes the approach they are per material (a material is an instance of a shader) and if you alter the material you alter everything using it, but this won't be optimal in some circumstances (say you have 1,000,000 objects with the same texture and vertices but different tint colours). If you register changes to bound when it comes to render the object you'd presumably end up just rebinding it for every instance so that's not great.
There is possible overlap in our thoughts between 2 and 5 here, in that 2 feels like its the instance of the material to me. There is the issue of using different instances of very similar materials on lots of otherwise identical objects... what is optimal probably depends on what takes more time to bind, textures or buffers. I get a feeling its the former but tests are needed... however given that we're likely to be using low res models but textures are size dependent not detail dependent, plumping for texture as a bigger drain is probably sensible.

Thought: is the material an instance of the shader program? Or could it be? We should check the question of needing to rebind if you use one program then another.
If it is an instance of the shader program (1) is not really usable and would have to be grouped with (2)... still you'd hope the total number of materials might be low? That said if we're doing this procedurally there's no reason for that to be true, unless we make it true.

Presumably event driven uniforms should have their update functions attached to the shaderProgram. Arguably we should attach all these functions to the shaderProgram object.
