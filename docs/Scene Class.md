# Scene Graph Thoughts

The graph (of render objects) is likely to be need to be reordered / regrouped during the course of the program, by various complicated groupings (by texture(s), by shader, by mesh), this is probably going to require a graph or linked list type structure(s).

However access/lookup in these types of graphs / lists is not particularly fast, it might be more sensible to keep an array (or dictionary with keys, if we mind having an array with possibly empty entries) of render objects and the render object itself would have a “node” entry that pointed to its node in the graph for quick lookup enabling us to take advantage of the (hopefully) fast removal / insertion properties of the graph (although looking for the correct place to put the object is never going to beat log(n) not a lot we can do about that).

Initially we should implement the naive option of just using the simple array / dictionary of render objects and rebind everything for each object on the shader, we can then move forward from a (hopefully) working scene.

Presumably we’re eventually going to need to a sorting operation every frame / render or at least anytime the camera or an object moves (so might as well be every frame), in that we have to at least sort the transparent / translucent objects against everything else.

(We should investigate deferred rendering before we implement this stuff maybe?)

## Tasks
Finalise renderobject structure (Q: Should every object have a list of instances, and it can just contain one if necessary, this is probably sensible?)

Implement the naive - rebind everything - shader class for test shaders (i.e. will include an updateShader(renderObject) on instances of that shader), the scene class can then use this function

We need to create a scene class, which keeps this list of objects and has a render function (and a main camera - presumably as a passed in argument on create, which an option in render to pass a different camera)! As well as add object to scene function, add instance etc.
  
We should consider renaming the ‘renderer’ as glfacade (or glf) then the real ‘renderer’ can live on top with possibly extra functions (although I’ve forgotten what I thought these would be so lets hold off on that until necessary). 
