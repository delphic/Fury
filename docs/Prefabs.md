# Prefabs

Prefabs need to be created by Fury (Fury.createPrefab), this stores the concept of that prefab and should not be affected by changes to instantiated prefabs.

An individual scene should _copy_ the information stored in Fury.prefabs into a local list of instantiatedPrefabs for that scene, when a prefab is first instantiated.

Instances are created by using the scene's local copy as a prototype for the new instance object and ensure a transform on the object itself.

This way all manipulations / renderings / calculations on the instance use the details in the scene's local list of prefabs, i.e. meshes, materials, shaders are determined by the local copy and any changes affect all instances in that scene, but do not affect the definition of the prefab.

The scene should obviously explicitly batch the rendering of prefabs together.

In order to support prefabs meshes and materials provide copy methods (copy of the associated shader is not performed in a material copy action, that should be a reference copy).

Note that we do not need to create the buffers for the mesh in the definition copy of the prefab they'll never be used as new ones will be created when instantiated.
