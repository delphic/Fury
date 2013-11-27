// glMatrix assumed global
var r = require('./renderer');
var indexedMap = require('./indexedMap');

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
		var currentShaderId, currentMaterialId, currentMeshId;

		var scene = Object.create(prototype);

		var renderObjects = indexedMap.create(); // No explicit instancing just yet - just a list of render renderObjects 
		// these renderObjects need to contain at minimum materialId, meshId, and transform (currently object just has material and mesh as well as transform)

		// Add Object 
		scene.add = function(object) {
			if(!object || !object.mesh || !object.material) {
				throw new Error("Mesh and Material must be present on the object.");
			}

			if(!object.material.id) {
				object.material.id = materials.add(object.material);
			}
			if(!object.material.shader.id) {
				object.material.shader.id = shaders.add(object.material.shader);
			}
			if(!object.mesh.id) {
				object.mesh.id = meshes.add(object.mesh);
			}

			// This shouldn't be done here, should be using a Fury.GameObject or similar concept, which will come with a transform
			// Should be adding a renderer component to said concept (?) 
			if(!object.position) {
				object.position = vec3.create();
			} 
			if(!parameters.rotation) {
				object.rotation = quat.create();
			}
			if(!object.scale) {
				object.scale = vec3.create();
			}

			var id = renderObjects.add(object);
			object.sceneId = id;
			return object;
		}
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
			
			// Brute Force for now, rebind EVERYTHING (so no need for the meshes / materials lists just yet)

			// TODO: Scene Graph - will check objects haven't 
			// Batched first by Material
			// Then by Mesh
			// Then render each Mesh Instance

			r.clear();

			for(var i = 0, l = renderObjects.keys.length; i < l; i++) {
				var object = renderObjects[renderObjects.keys[i]];

				// TODO: Frustum Culling

				var shader = object.material.shader;
				if(!shader.id || shader.id != currentShaderId) {
					if(!shader.id) {	// Shader was changed on the material since originally added to scene
						shader.id = shaders.add(shader); 
					}
					currentShaderId = shader.id;
					r.useShaderProgram(shader.shaderProgram);
				} 

				r.setUniformMatrix4(shader.pMatrixUniformName, pMatrix);

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
				mat4.fromRotationTranslation(mvMatrix, object.rotation, object.position);
				mat4.multiply(mvMatrix, cameraMatrix, mvMatrix);	

				r.setUniformMatrix4(shader.mvMatrixUniformName, mvMatrix);
				
				r.draw(object.mesh.renderMode, object.mesh.indexed ? object.mesh.indexBuffer.numItems : object.mesh.vertexBuffer.numItems, object.mesh.indexed, 0);
			}
		}

		if(parameters && parameters.camera) {
			scene.addCamera(camera);
		}

		return scene;
	};

	return exports;
}();