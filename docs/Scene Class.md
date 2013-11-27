# Scene Graph Thoughts

The graph (of render objects) is likely to be need to be reordered / regrouped during the course of the program, by various complicated groupings (by texture(s), by shader, by mesh), this is probably going to require a graph or linked list type structure(s).

However access/lookup in these types of graphs / lists is not particularly fast, it might be more sensible to keep an array (or dictionary with keys, if we mind having an array with possibly empty entries) of render objects and the render object itself would have a “node” entry that pointed to its node in the graph for quick lookup enabling us to take advantage of the (hopefully) fast removal / insertion properties of the graph (although looking for the correct place to put the object is never going to beat log(n) not a lot we can do about that).

Initially we should implement the naive option of just using the simple array / dictionary of render objects and rebind everything for each object on the shader, we can then move forward from a (hopefully) working scene.

Presumably we’re eventually going to need to a sorting operation every frame / render or at least anytime the camera or an object moves (so might as well be every frame), in that we have to at least sort the transparent / translucent objects against each other. Note: Painters algorithm for items with alpha.

# Refined Scene Thoughts

Minimising rebinds (getting the benefits of instancing without having to be explicit about it - although if an editor is created will probably need an explicit option too).

Stage 1: 

Check if rebind necessary (i.e. store current Shader / Material / Mesh Id) (also possibly will need a rebind flag on meshes for if you dynamically alter them)

Stage 2:	

i) Order the render objects when created so they are rendered in an order that minimises rebinds

ii) Store the materialId / meshId on the render object and check for changes compared to object.material.id, if it changes add it to a list for re-ordering

iii) Take list of items to be reordered and put them back into the correct place in the scene grap

## Note on Alpha:
Depth testing only needs to be disabled if there are back faces... simple way to solve this, no back faces allowed.
This means we only need to order items with transparency by depth and render them after the solid objects.
Initially items with back faces just won't work, an extension would be to split items with a material including alpha transparency into sub-meshes which can then be ordered.

## Note on Textures:
We can bind multiple textures and store the place you've bound it. 
This means we don't necessarily need to rebind textures even when switching between materials (?).
	Q: Do you need to rebind texture on changing shader?

## Note on ordering:
Obviously we need to group by having the same material and the same mesh. 
We can do better!
	Group materials with the same shaders.
	Group materials which share the same textures.

Arguably we could look for different meshes which share buffers too!

## Note on depth ordering:
Items which use alpha blending need to be ordered by depth, which sorting algorithm to use is an interesting question.

If the camera isn't rotating insertion sort probably would win (http://en.wikipedia.org/wiki/Insertion_sort), however doing a quick 180 with the camera would quickly approach the worst case senario for insertion sort. 

Perhaps initially we should just do merge-sort as it'll be pretty good for most circumstances (although we should possibly check the factors for low values etc etc). 
 
