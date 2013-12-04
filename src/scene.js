// glMatrix assumed global
var r = require('./renderer');
var indexedMap = require('./indexedMap');
var Material = require('./material');
var Mesh = require('./mesh');
var Transform = require('./transform');

var Scene = module.exports = function() {
	var nextSceneId = 0;
	var exports = {};
	var prototype = {};

	// Note Meshes and Materials shared across scenes
	// Going to use dictionaries but with an array of keys for enumeration (hence private with accessor methods)
	var meshes = indexedMap.create();
	var materials = indexedMap.create();
	var shaders = indexedMap.create();
	
	var create = exports.create = function(parameters) {
		var sceneId = (nextSceneId++).toString();
		var cameras = {};
		var cameraNames = [];
		var mainCameraName = "main";
		var pMatrix = mat4.create(), mvMatrix = mat4.create(), cameraMatrix = mat4.create();	// mvMatrix may need to be a stack in future (although a stack which avoids unnecessary mat4.creates)
		var currentShaderId, currentMaterialId, currentMeshId, pMatrixRebound = false;

		var scene = Object.create(prototype);

		// these renderObjects / instances on prefabs need to contain at minimum materialId, meshId, and transform (currently object just has material and mesh as well as transform)
		var renderObjects = indexedMap.create(); // TODO: use materialId / meshId to bind
		var prefabs = { keys: [] };	// Arguably instances could be added to renderer objects and memory would still be saved, however keeping a separate list allows easier batching for now
		// TODO: Should have an equivilent to indexedMap but where you supply the keys, keyedMap?.

		// Add Object 
		// TODO: RenderObject / Component should have its own class
		scene.add = function(parameters) {
			var object = {};
			if(!parameters || !parameters.mesh || !parameters.material) {
				throw new Error("Mesh and Material must be present on the object.");
			}

			object.material = parameters.material;
			object.mesh = parameters.mesh;
			
			if(!object.mesh.id) {
				object.mesh.id = meshes.add(object.mesh);
				object.meshId = object.mesh.id;
			}
			if(!object.material.id) {
				object.material.id = materials.add(object.material);
				object.materialId = object.material.id;
			}
			if(!object.material.shader.id) {
				object.material.shader.id = shaders.add(object.material.shader);
			}

			// This shouldn't be done here, should be using a Fury.GameObject or similar concept, which will come with a transform
			// Should be adding a renderer component to said concept (?) 
			object.transform = Transform.create(parameters); 	

			var id = renderObjects.add(object);
			object.sceneId = id;
			object.remove = function() {
				renderObjects.remove(this.id);
			}; // TODO: Move to prototype
			return object;
		}

		scene.instantiate = function(parameters) {
			var prefab;
			if(!parameters || !parameters.name || !Fury.prefabs[parameters.name]) {
				throw new Error("You must provide a valid prefab name");
			}
			if(!prefabs[parameters.name]) {
				var defn = Fury.prefabs[parameters.name];
				if(!defn.material || !defn.mesh) {
					throw new Error("Requested prefab must have a material and a mesh present");
				} 
				prefab = {
					name: parameters.name,
					instances: indexedMap.create(),
					mesh: Mesh.copy(defn.mesh),
					material: Material.copy(defn.material),
					remove: function() {
						this.instaces.remove(this.id);
						// Note not deleting the locally stored prefab, even if !instances.length as we would get duplicate mesh / materials if we were to readd
						// Keeping the prefab details around is preferable and should be low overhead
					}
				};
				if(!prefab.mesh.id) {
					prefab.mesh.id = meshes.add(prefab.mesh);
					prefab.meshId = prefab.mesh.id;
				} 
				if(!prefab.material.id) {
					prefab.material.id = materials.add(prefab.material);
					prefab.materialId = prefab.material.id;
				}
				if(!prefab.material.shader.id) {
					prefab.material.shader.id = shaders.add(prefab.material.shader);
				}
				prefabs[parameters.name] = prefab;
				prefabs.keys.push(parameters.name);
			} else {
				prefab = prefabs[parameters.name];
			}
			var instance = Object.create(prefab);
			instance.transform = Transform.create(parameters);
			instance.id = prefab.instances.add(instance);
			return instance;
		};

		// Add Camera
		scene.addCamera = function(camera, name) {
			var key = name ? name : "main";
			if(cameraNames.length == 0) {
				mainCameraName = key;
			} 
			if(!cameras.hasOwnProperty(key)) {
				cameraNames.push(key);
			}
			cameras[key] = camera;
		}

		// Render
		scene.render = function(cameraName) {
			var camera = cameras[cameraName ? cameraName : mainCameraName];
			camera.getProjectionMatrix(pMatrix);
			mat4.fromRotationTranslation(cameraMatrix, camera.rotation, camera.position);
			pMatrixRebound = false;
			// Simple checks for now - no ordering

			// TODO: Scene Graph 
			// Batched first by Material
			// Then by Mesh
			// Then render each Mesh Instance

			// Extension batch materials such that shaders and then textures used overlap

			r.clear();

			// TODO: Scene graph will provide these as a single thing to loop over, will then only split and loop for instances at mvMatrix binding / drawing
			// Scene Graph should be class with enumerate() method, that way it can batch as described above and sort watch its batching whilst providing a way to simple loop over all elements 
			for(var i = 0, l = renderObjects.keys.length; i < l; i++) {
				// TODO: Frustum Culling	
				bindAndDraw(renderObjects[renderObjects.keys[i]]);
			}
			for(i = 0, l = prefabs.keys.length; i < l; i++) {
				var instances = prefabs[prefabs.keys[i]].instances;
				for(var j = 0, n = instances.keys.length; j < n; j++) {
					// TODO: Frustum Culling
					bindAndDraw(instances[instances.keys[j]]);
				}
			}
		};

		var bindAndDraw = function(object) {	// TODO: Separate binding and drawing
			var shader = object.material.shader;

			if(!shader.id || shader.id != currentShaderId) {
				if(!shader.id) {	// Shader was changed on the material since originally added to scene
					shader.id = shaders.add(shader); 
				}
				currentShaderId = shader.id;
				r.useShaderProgram(shader.shaderProgram);
				pMatrixRebound = false;
			} 

			if(!pMatrixRebound) {
				// New Shader or New Frame, rebind projection Matrix
				r.setUniformMatrix4(shader.pMatrixUniformName, pMatrix);
				pMatrixRebound = true;	
			}
			
			if(!object.material.id || object.material.id != currentMaterialId) {
				if(!object.material.id) {	// material was changed on object since originally added to scene
					object.material.id = materials.add(object.material);
				}
				currentMaterialId = object.material.id;
				shader.bindMaterial.call(r, object.material);
			}

			if(!object.mesh.id || object.mesh.id != currentMeshId) {
				if(!object.mesh.id) {	// mesh was changed on object since originally added to scene
					object.mesh.id = mesh.add(object.mesh);
				}
				currentMeshId = object.mesh.id;
				shader.bindBuffers.call(r, object.mesh);
			}

			// TODO: If going to use child coordinate systems then will need a stack of mvMatrices and a multiply here
			mat4.fromRotationTranslation(mvMatrix, object.transform.rotation, object.transform.position);
			mat4.scale(mvMatrix, mvMatrix, object.transform.scale);
			mat4.multiply(mvMatrix, cameraMatrix, mvMatrix);	
			r.setUniformMatrix4(shader.mvMatrixUniformName, mvMatrix);
				
			r.draw(object.mesh.renderMode, object.mesh.indexed ? object.mesh.indexBuffer.numItems : object.mesh.vertexBuffer.numItems, object.mesh.indexed, 0);	
		};

		if(parameters && parameters.camera) {
			scene.addCamera(camera);
		}

		return scene;
	};

	return exports;
}();