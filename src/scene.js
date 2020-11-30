var r = require('./renderer');
var indexedMap = require('./indexedMap');
var Material = require('./material');
var Mesh = require('./mesh');
var Transform = require('./transform');
var Maths = require('./maths');
var Bounds = require('./bounds');
var mat2 = Maths.mat2,
	mat3 = Maths.mat3,
	mat4 = Maths.mat4,
	quat = Maths.quat,
	quat2 = Maths.quat2,
	vec2 = Maths.vec2,
	vec3 = Maths.vec3,
	vec4 = Maths.vec4;

var Scene = module.exports = function() {
	var nextSceneId = 0;
	var exports = {};
	var prototype = {};

	// Note Meshes and Materials shared across scenes
	// Going to use dictionaries but with an array of keys for enumeration (hence private with accessor methods)
	var meshes = indexedMap.create();
	var materials = indexedMap.create();
	var shaders = indexedMap.create();
	var textures = indexedMap.create();

	var create = exports.create = function(parameters) {
		var sceneId = (nextSceneId++).toString();
		var cameras = {};
		var cameraNames = [];
		var mainCameraName = "main";
		// mvMatrix may need to be a stack in future (although a stack which avoids unnecessary mat4.creates)
		var pMatrix = mat4.create(), mvMatrix = mat4.create(), nMatrix = mat3.create(), cameraMatrix = mat4.create(), cameraOffset = vec3.create(), inverseCameraRotation = quat.create();
		var currentShaderId, currentMaterialId, currentMeshId, pMatrixRebound = false;
		var nextTextureLocation = 0, currentTextureBindings = {}, currentTextureLocations = [];	// keyed on texture.id to binding location, keyed on binding location to texture.id

		var scene = Object.create(prototype);

		// these renderObjects / instances on prefabs need to contain at minimum materialId, meshId, and transform (currently object just has material and mesh as well as transform)
		var renderObjects = indexedMap.create(); // TODO: use materialId / meshId to bind
		var prefabs = { keys: [] };	// Arguably instances could be added to renderer objects and memory would still be saved, however keeping a separate list allows easier batching for now
		// TODO: Should have an equivilent to indexedMap but where you supply the keys, keyedMap?.
		var alphaRenderObjects = [];
		var depths = {};

		var addTexturesToScene = function(material) {
			for(var i = 0, l = material.shader.textureUniformNames.length; i < l; i++) {
				var uniformName = material.shader.textureUniformNames[i];
				var texture = material.textures[uniformName];
				if(texture) {
					textures.add(texture);
					bindTextureToLocation(texture);
				}

			}
		};

		var bindTextureToLocation = function(texture) {
			if(currentTextureLocations.length < r.TextureLocations.length) {
				r.setTexture(currentTextureLocations.length, texture);
				currentTextureBindings[texture.id] = currentTextureLocations.length;
				currentTextureLocations.push(texture.id);
			} else {
				// replace an existing texture
				delete currentTextureBindings[currentTextureLocations[nextTextureLocation]];
				r.setTexture(nextTextureLocation, texture);
				currentTextureBindings[texture.id] = nextTextureLocation;
				currentTextureLocations[nextTextureLocation] = texture.id;
				nextTextureLocation = (nextTextureLocation+1)%r.TextureLocations.length;
			}
		};

		var addToAlphaList = function(object, depth) {
			depths[object.sceneId] = depth;
			// Binary search
			// Could technically do better by batching up items with the same depth according to material / mesh like sence graph
			var less, more, itteration = 1, inserted = false, index = Math.floor(alphaRenderObjects.length/2);
			while(!inserted) {
				less = (index === 0 || depths[alphaRenderObjects[index-1].sceneId] <= depth);
				more = (index >= alphaRenderObjects.length || depths[alphaRenderObjects[index].sceneId] >= depth);
				if(less && more) {
					alphaRenderObjects.splice(index, 0, object);
					inserted = true;
				} else {
					itteration++;
					var step = Math.ceil(alphaRenderObjects.length/(2*itteration));
					if(!less) {
						index -= step;
					} else {
						index += step;
					}
				}
			}
		};

		// Add Object
		// TODO: RenderObject / Component should have its own class
		scene.add = function(parameters) {
			var object = {};
			if(!parameters || !parameters.mesh || !parameters.material) {
				throw new Error("Mesh and Material must be present on the object.");
			}

			object.material = parameters.material;
			object.mesh = parameters.mesh;

			object.meshId = meshes.add(object.mesh);
			object.materialId = materials.add(object.material);
			object.shaderId = shaders.add(object.material.shader);
			object.material.shaderId = object.shaderId;
			addTexturesToScene(object.material);

			// Probably want to move to a stronger ECS concept
			// Adding a transform component is probably fine
			// as the renderer requires it.
			object.transform = Transform.create(parameters);
			object.bounds = Bounds.create({ center: object.transform.position, size: object.mesh.bounds.size });
			// Bound to transform position (just so long as you dont' overwrite it)

			object.sceneId = renderObjects.add(object);

			return object;
		};

		scene.remove = function(object) {
			// Note: This does not free up the resources (e.g. mesh and material references remain) in the scene, may need to reference count these and delete
			if (object.sceneId !== undefined) {
				renderObjects.remove(object.sceneId);
			} else if (object.id) {
				// Is prefab, look on prototype for instances and remove this
				object.instances.remove(object.id);
				// Note not deleting the locally stored prefab, even if !instances.length as we would get duplicate mesh / materials if we were to readd
				// Keeping the prefab details around is preferable and should be low overhead
			}
		};

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
					material: Material.copy(defn.material)
				};
				prefab.meshId = meshes.add(prefab.mesh);
				prefab.materialId = materials.add(prefab.material);
				prefab.shaderId = shaders.add(prefab.material.shader);
				prefab.material.shaderId = prefab.shaderId;
				addTexturesToScene(prefab.material);
				prefabs[parameters.name] = prefab;
				prefabs.keys.push(parameters.name);
			} else {
				prefab = prefabs[parameters.name];
			}
			var instance = Object.create(prefab);
			instance.transform = Transform.create(parameters);
			instance.bounds = Bounds.create({ center: instance.transform.position, size: prefab.mesh.bounds.size });
			// Bound to transform position (just so long as you dont' overwrite it)
			instance.id = prefab.instances.add(instance);
			return instance;
		};

		// Add Camera
		scene.addCamera = function(camera, name) {
			var key = name ? name : "main";
			if(cameraNames.length === 0) {
				mainCameraName = key;
			}
			if(!cameras.hasOwnProperty(key)) {
				cameraNames.push(key);
			}
			cameras[key] = camera;
		};

		// Render
		scene.render = function(cameraName) {
			var camera = cameras[cameraName ? cameraName : mainCameraName];
			if (camera.enableCulling) {
				camera.calculateFrustrum();				
			}
			camera.getProjectionMatrix(pMatrix);
			// Camera Matrix should transform world space -> camera space
			quat.invert(inverseCameraRotation, camera.rotation);						// TODO: Not quite sure about this, camera's looking in -z but THREE.js does it so it's probably okay
			mat4.fromQuat(cameraMatrix, inverseCameraRotation);
			mat4.translate(cameraMatrix, cameraMatrix, vec3.set(cameraOffset, -camera.position[0], -camera.position[1], -camera.position[2]));

			pMatrixRebound = false;
			alphaRenderObjects.length = 0;
			// Simple checks for now - no ordering

			// TODO: Scene Graph
			// Batched first by Shader
			// Then by Material
			// Then by Mesh
			// Then render each Mesh Instance
			// An extension would be to batch materials such that shaders that textures used overlap

			// This batching by shader / material / mesh may need to be combined with scene management techniques
			// I.e. Scene graph would include things like frustrum culling

			r.clear();

			// TODO: Scene graph should provide these as a single thing to loop over, will then only split and loop for instances at mvMatrix binding / drawing
			// Scene Graph should be class with enumerate() method, that way it can batch as described above and sort watch its batching / visibility whilst providing a way to simple loop over all elements
			for(var i = 0, l = renderObjects.keys.length; i < l; i++) {
				var renderObject = renderObjects[renderObjects.keys[i]];
				renderObject.bounds.calculateMinMax();	// TODO: Only if !static
				if (!camera.enableCulling || camera.isInFrustum(renderObject.bounds)) {
					if(renderObject.material.alpha) {
						addToAlphaList(renderObject, camera.getDepth(renderObject));
					} else {
						bindAndDraw(renderObject);
					}
				}
			}
			for(i = 0, l = prefabs.keys.length; i < l; i++) {
				var instances = prefabs[prefabs.keys[i]].instances;
				for(var j = 0, n = instances.keys.length; j < n; j++) {
					var instance = instances[instances.keys[j]];
					instance.bounds.calculateMinMax();	// TODO: Only if !static
					if (!camera.enableCulling || camera.isInFrustum(instance.bounds)) {
						if(instance.material.alpha) {
							addToAlphaList(instance, camera.getDepth(instance));
						} else {
							bindAndDraw(instance);
						}
					}
				}
			}
			for(i = 0, l = alphaRenderObjects.length; i < l; i++) {
				var renderObject = alphaRenderObjects[i];
				// Could probably do this in bind and draw method
				r.enableBlending(renderObject.material.sourceBlendType, renderObject.material.destinationBlendType, renderObject.material.blendEquation);
				bindAndDraw(renderObject);
			}
			r.disableBlending();
		};

		var bindAndDraw = function(object) {	// TODO: Separate binding and drawing
			var shader = object.material.shader;
			var material = object.material;
			var mesh = object.mesh;
			// BUG:
			// If there's only one material or one mesh in the scene real time changes to the material or mesh will not present themselves as the id will still match the currently bound
			// mesh / material, seems like we're going need a flag on mesh / material for forceRebind for this case. (should probably be called forceRebind as it 'might' be rebound anyway)
			// Having now determined that actually we don't need to rebind uniforms when switching shader programs, we'll need this flag whenever there's only one mesh or material using a given shader.

			// TODO: When scene graph implemented - check material.shaderId & object.shaderId against shader.id, and object.materialId against material.id and object.meshId against mesh.id
			// as this indicates that this object needs reordering in the graph (as it's been changed).

			var shaderChanged = false;
			var materialChanged = false;
			if(!shader.id || shader.id != currentShaderId) {
				shaderChanged = true;
				if(!shader.id) {	// Shader was changed on the material since originally added to scene
					material.shaderId = shaders.add(shader);
					object.shaderId = material.shaderId;
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

			if(!material.id || material.id != currentMaterialId || material.dirty) {
				if(!material.dirty) {
					materialChanged = true;
				} else {
					material.dirty = false;
				}
				if(!material.id) {	// material was changed on object since originally added to scene
					object.materialId = materials.add(material);
				}
				currentMaterialId = material.id;
				shader.bindMaterial.call(r, material);
			}

			if(shaderChanged || materialChanged) {
				// Texture Rebinding dependencies
				// If the shader has changed you DON'T need to rebind, you only need to rebind if the on the uniforms have changed since the shaderProgram was last used...
					// NOTE Large Changes needed because of this
					// I think we're just going to have to add a flag to materials and meshes to say "rebind" (because I've changed something)
					// This also means we should move the "currentMeshId / currentMaterial id to the shader instead or keep a keyed list on shader the id
					// Lets do this after we've done the texture binding though eh? so for now just rebind everything if shader or material changes (overkill but it'll work)
				// If the material has changed textures may need rebinding

				// Check for gl location rebinds needed, if any needed and rebind all to make sure we don't replace a texture we're using
				var locationRebindsNeeded = false;
				for(var i = 0, l = shader.textureUniformNames.length; i < l; i++) {
					var uniformName = shader.textureUniformNames[i];
					if(material.textures[uniformName]) {
						var texture = material.textures[uniformName];
						if(!texture.id) {
							textures.add(texture);
							locationRebindsNeeded = true;
							break;
						}
						if(isNaN(currentTextureBindings[texture.id])) {
							locationRebindsNeeded = true;
							break;
						}
					}
				}
				// Rebind if necessary and set uniforms
				for(i = 0, l = shader.textureUniformNames.length; i < l; i++) {
					var uniformName = shader.textureUniformNames[i];
					if(material.textures[uniformName]) {
						var texture = material.textures[uniformName];
						if(locationRebindsNeeded) {
							bindTextureToLocation(texture);
						}
						r.setUniformInteger(uniformName, currentTextureBindings[texture.id]);
					}
				}
			}

			if(!mesh.id || mesh.id != currentMeshId || mesh.dirty) {
				if(!mesh.id) {	// mesh was changed on object since originally added to scene
					object.meshId = mesh.add(mesh);
				}
				currentMeshId = mesh.id;
				shader.bindBuffers.call(r, mesh);
				mesh.dirty = false;
			}

			// TODO: If going to use child coordinate systems then will need a stack of mvMatrices and a multiply here
			mat4.fromRotationTranslation(mvMatrix, object.transform.rotation, object.transform.position);
			mat4.scale(mvMatrix, mvMatrix, object.transform.scale);
			if (shader.mMatrixUniformName) {
				// TODO: Arguably should send either MV Matrix or M and V Matrices
				r.setUniformMatrix4(shader.mMatrixUniformName, mvMatrix);
			}
			mat4.multiply(mvMatrix, cameraMatrix, mvMatrix);
			r.setUniformMatrix4(shader.mvMatrixUniformName, mvMatrix);

			if (shader.nMatrixUniformName) {
				mat3.normalFromMat4(mvMatrix, nMatrix);
				r.setUniformMatrix3(shader.nMatrixUniformName, nMatrix);
			}

			r.draw(mesh.renderMode, mesh.indexed ? mesh.indexBuffer.numItems : mesh.vertexBuffer.numItems, mesh.indexed, 0);
		};

		if(parameters && parameters.camera) {
			scene.addCamera(parameters.camera);
		}

		return scene;
	};

	return exports;
}();
