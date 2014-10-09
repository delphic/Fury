# Lighting 

## Initial Thoughts

So now the time comes to implement lighting! There is the obvious and well used system that exists in most engines: Ambient, Point, Spot, Directional. With the extensions of area / volume lights (ambient and directional) as used in the Spark engine. There are also texture based lights to consider.

These implementing these for dynamic objects is the straight forward case of implementing them in the shader, for static objects a light mapping system may be in order. There are also the considerations of shadow volumes and shadow maps to consider.

Given all the extra extensions to go beyond the areas we're familiar with it may well be worth implementing these simply as at this conceptutal level.

However there is also the consideration of different lighting systems, lights are more generically objects which can be added to a scene which affect the materials of other objects in the scene. It should be possible to implement lights as generically as we have implemented uniforms which would allow further objects of this type to be added easily, and would presumably make implementing alternative lighting systems more simple.

That said I think perhaps it would be best to implement this in the straight forward fashion, keeping an eye on the properties that are shared and implied by type, and documenting in comments / here. We can refactor later when the requirements become more clear.

Each light type will require the following:
Intensity / Brightness
Colour
Range (a way to keep the number of items considered by the prioritisation function limited)
A function for prioritisation (when only a limited number of lights can be accomodated in a shader)

The type of light defines how the lights intensity is affected by distance / direction, in a realistic setting this would be strongly linked to the prioritisation function. For example, a point light's effective intensity decreases with distance squared.

## Revisit

In the current system with shaders each shader specifies a function which takes a material and applies uniforms as necessary. A similar system could be used for lighting.

With lighting, information must be gleaned from various sources, each mesh being rendered would need to use the relative positioning between itself and any light sources as well as information on the lights themselves to bind the necessary uniforms. I don't see an easy way of minimising this rebinds, however this stage could possibly include a light or shadow map.

The "bindLighting" function would need to take parameters of the position and bounding area of the mesh in question and a 'lighting' object which could be queried as required for that shader for the lighting information that should be prioritised  for that mesh. 

I would like to keep the details of the light types and lighting model out of the scene in so far as possible, however conceptually you do add lights to a scene, perhaps a lighting model / object can be supplied when setting up a scene (a default would be sensible, then again requiring the explicit passing in makes the dependency injection more obvious). The scene will need to know to call "bindLighting" for each rendered object anyhow and it will need access to the lighting information.

There are various combinations and permutations that for performance reason should be singled out (static vs. dynamic objects, static vs dynamic lights and the combination thereof), however the simpliest but most expensive case of both being dynamic with no assumptions and optimisation would be the easiest to tackle first.

Area's which possibly need to tackled in tandem with this would be the gameobject / component system that is not quite formalised yet, and the concept of a static flag on these objects, which I think would be better to implement sooner rather than later.