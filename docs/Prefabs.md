# Prefabs

Prefabs need to be created with Fury (`Fury.Prefab.create`), this stores the concept of that prefab and should not be affected by changes to instantiated prefabs.

The instantiate method on Fury.Scene uses the configuration information stored in Fury.Prefab.prefabs to create a prototype instance for that scene when it is first called. Scene instances are created from this prototype with a transform component attached and returned by the method.

This way all manipulations / renderings / calculations on the instance use the details in the scene's local list of prefabs, i.e. meshes, materials, shaders are determined by the local copy and any changes affect all instances in that scene, but do not affect the definition of the prefab.

The scene explicitly batches the rendering of prefabs together to minimise GPU calls, as long as the material does not use alpha blending.

Note that the prefab definition only contains the config for mesh and material, not the mesh buffers nor the material instances themselves, as new instances are created by the scene on instantiation.
