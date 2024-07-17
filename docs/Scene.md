# Scene

The scene module provides a way to more easily render a 3D scene.

A camera is required when creating a scene instance.

Objects are added to a scene by providing a `Mesh` and `Material` instance, and created scene object receives a `Transform` property if one is not provided.

If the `static` flag is passed when adding the object, AABB bounds are calculated, which - if culling is enabled - are used with frustum culling, otherwise a sphere shape of the mesh's bounding radius is used.

The instance method `render` then draws the scene to the WebGL canvas, as such it interfaces with the `Shader` module to automatically calculate and bind the necessary model, normal, view and projection matrices required by the shader definition, using the currently configured camera with the transform on each object. It also calls the necessary clear functions as specified by the current camera.

It calls the shader definition's `bindMesh`, `bindMaterial`, and `bindInstance` functions, passing the renderer as `this`, as required by the order in which objects were added to the scene. **NOTE**: it does not currently order the added objects to minimise rebinds, but it does avoid unnecessary rebinds with the provided order.

The scene also automatically orders any objects using a material with a truthy `alpha` property based on depth so that they are blended correctly, rendering them after all scene objects which do not use a material with alpha blending.

It also provides a instantiate method for use with the `Prefab` module, prefabs which do not make use of alpha blending are ordered together regardless of the order in which they are added to the scene, and as such provides an interface that allows for explicit batching to minimize shader uniform and attribute rebinds.

### In summary the scene provides:

1. Automatic calculation of matrices for 3D projection
2. Calls the bind functions of the shader definition on the provided material minimally
3. Depth ordering of alpha blended objects
4. Explicit batching of draw calls to prefabs

## Refactoring Required for Efficient 2D Rendering

If we wished to make an efficient UI or 2D renderer we would likely wish to control the order of rendering, as these likely will make use of alpha blending with an orthographic projection, for which calculating the depth each frame is unnecessary an arguably z depth need not be provided.

For generic 2D rendering we would like want to explictly control the draw order in game code. as we can know which order we need to render different types of object.

For UI rendering we would likely wish to make use of a hierarchy and render according to a breadth first search.

To do this we would like want to extract the logic of #2 currently provided by the (3D) scene module, and a modified version of #1 simplified for 2D rendering, into helpers which could be used both as needed by game code and a dedicate UI renderer.

Given that many 2D games have been made successfully using 3D rendering pipelines including UI (for example 2D Toolkit for Unity, before UGUI was provided), it is probably better to wait for a use case before performing these refactors. 

However it should be noted that `TileMap` and `TextMesh` both currently depend on providing a (3D) scene instance and make use of the prefab functionality to minimise rebinds, these would also need to be refactored to attempt this refactor.

## Known Issues / Improvemnts

Transform hierarchies are naively recalculated for each object, which can potentially result in duplicate calculations.

Objects are rendered in the order they are added to the scene rather than being batched by mesh, material or textures used.

All textures are rebound on switching shader program, this is not strictly necessary and could result an improvement in performance without implementing the above.

Mesh, material, shader and texture resources are shared between scenes, however you can only clear all resources rather than currently unused should a subset of scenes no longer be required.