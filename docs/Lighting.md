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