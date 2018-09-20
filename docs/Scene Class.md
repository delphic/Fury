# Scene Class

The purpose of the scene class is to store objects which need rendering, apply the appropriate render state changes, upload relevant data to the render and minimise these render state changes where possible.

Scene management - e.g. Octrees, BSP, frustum culling, i.e. visibility handling - is outside this scope and should be handled by a scene graph which the scene class can consume, this will be covered in a separate document.

## Data Structures

The graph / structure of render objects held by the sense will occasionally need to be reordered / regrouped (although how often do you really change the mesh or material of an object at run time - less than you leave it the same that's for sure), this might suggest a graph or linked list type structures(s).

However access/lookup in these types of graphs / lists is not particularly fast, and this will the primary action undertaken. It will be more sensible to keep a dictionary with keys of render objects and the render object itself will have a "sceneId" which can be used to index in a scene graph or when grouped information by shader / material / mesh for quick lookup enabling us to take advantage of the (hopefully) fast removal / insertion properties of whatever structure we decide for the graph (although looking for the correct place to put the object is never going to beat log(n) not a lot we can do about that).

Note that we’re going to need to a sorting operation every frame / render or at least anytime the camera or an object moves (so might as well be every frame), in that we have to sort the transparent / translucent objects against each other. Note: Painters algorithm for items with alpha. Currently using a binary search system.

## Minimising Render State Changes

Stage 1:

The render loop checks if rebind of information, change of state is necessary (i.e. store current Shader / Material / Mesh Id for the shaderProgram)

Stage 2:

i) Order the render objects when created so they are rendered in an order that minimises rebinds (the most basic of which is by materials and within that by mesh)

ii) Store the materialId / meshId on the render object and check for changes compared to object.material.id, if it changes add it to a list for re-ordering

iii) Take list of items to be reordered and put them back into the correct place in the scene groupings

## Note on Alpha:
Depth testing only needs to be disabled if there are back faces... simple way to solve this, no back faces allowed.
This means we only need to order items with transparency by depth and render them after the solid objects.
Initially items with back faces just won't work, an extension would be to split items with a material including alpha transparency into sub-meshes which can then be ordered.

## Note on Textures:
We bind multiple textures and store the place it's been bound so it can be reused.
Note each individual shader can only use the maximum number of bound shaders, when needing to bind a texture not yet bound and all 'slots' are currently taken, the scene must make sure all textures for that material are bound.
	E.g. you might find all but on texture was bound, but then when you then bound the last texture you have to make sure you don't replace another texture you needed!

## Note on ordering:
The simplest grouping as by having the same material and the same mesh.

We can do better!
	Group materials with the same shaders.
	Group materials which share the same textures.

Arguably we could look for different meshes which share buffers too!
