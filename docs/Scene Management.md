# Scene Management

## Thoughts

Firstly a bit of tidying work we should batch up all the properties we keep on objects in the scene into a list of scene objects, the key being the sceneId of the object (we might say want to store the culling frustrum for a given object / prefab ( = mesh.boundingRadius * Math.max(object.scale[0], object.scale[1], object.scale[2]) )).

Secondly in order to have both the batching by material (and then by mesh) and have culling of visible items via a scene graph, the simpliest solution would appear to be running the scene graph first to determine if each object / instance is visible and then looping over the already built material / mesh batched graph* and then rendering based on the result of the scene graph (* As checking for changes is pretty easy to memoise on this graph / structure and changes should be rare we're planning to detect changes on object on rendering and update graph for next frame).

There is further question when implementing, that is if when using heirachical scene graphs, if we need to drill down into sets that have been discarded and mark each of them as not visible, this seems unnecessary but looping over the visibility information and setting all items in the graph to not visible and then only changing those which the graph deems visible would at best tend to looping over all objects even if we stored this information separately. So it looks at the moment like we'll need to go through every object, we just won't need to perform the visibility check at every level if it's failed higher up.

This does not however allow for ordering of rendering by scene graph, (e.g. render closer opaque objects first), this would require we combine both. Given that we're aiming for
a configurable and flexible solution (i.e. could equally use oct-trees, quad-tree, frustum culling or none) this seems like something we're going to have to skip on.

Another consideration we need to make with scene graphs (used for visibility determination as opposed to the batching by material) is the concept of static versus dynamic objects. 
It's almost certainly impractical to recalculate the scenegraph on the fly (although we should obviously test this) every frame so treating all objects as dynamic is almost certainly 
out, and given we've opted not to use setters then we would need to provide an update function to call if the user changed the position such that it invalidated the scene graph. 

The possibly more sensible option is to require objects are added to the scene graph, so the user would only add static objects and it's implicitly their responsibility to update the 
scene graph if they alter the objects which they've added to the graph (the update function would presumably live on the graph taking a sceneId rather than on the object). Further 
user overhead and responsibility is unavoidable if we're going to give the flexibility to choose their scene graph.

However the static versus dynamic object is likely to come up again if we have any 'offline' rendering methods, e.g. lightmaps / shadowmaps, so perhaps introducing the distinction and 
automatically including all static objects in the scene graph of choice is viable. Dynamic objects presumably would be perhaps frustrum and portal culled and we should consider the 
possibility that updating the position in scene graph of all dynamic objects each frame might be viable. 

So we've got a number of options here, actual tests and code are going to be need to choose the best approach (I'm leaning towards a static / dynamic distinction and automatic adding to
graph and update each frame of dynamic objects, atm). It is also imperitive that we include some level of profiling (FPS at the least!), so perhaps providing the awake / loop functions 
within fury is the next step as this'll allow us to add at the very least a console.log of the FPS.