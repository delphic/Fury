# Prefabs

Prefabs need to be created with Fury (Fury.Preafb.create), this stores the concept of that prefab and should not be affected by changes to instantiated prefabs.

The instantiate method on Fury.Scene uses the configuration information stored in Fury.Prefab.prefabs to create a prototype instance for that since when a prefab is first instantiated. Scene instances are created from this prototype with a transform component attached. 

This way all manipulations / renderings / calculations on the instance use the details in the scene's local list of prefabs, i.e. meshes, materials, shaders are determined by the local copy and any changes affect all instances in that scene, but do not affect the definition of the prefab.

The scene explicitly batches the rendering of prefabs together.

Note that the prefab definition only contains the config for mesh and material, not the mesh buffers nor the material instances themselves, as new instances are created by the scene on instantiation.
