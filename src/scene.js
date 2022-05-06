const r = require('./renderer');
const IndexedMap = require('./indexedMap');
const Material = require('./material');
const Mesh = require('./mesh');
const Prefab = require('./prefab');
const Transform = require('./transform');
const Maths = require('./maths');
const Bounds = require('./bounds');
const { mat3, mat4, quat, vec3 } = Maths;

module.exports = (function() {
	let nextSceneId = 0;
	let exports = {};

	// Note Meshes and Materials shared across scenes
	// Going to use dictionaries but with an array of keys for enumeration (hence private with accessor methods)
	let meshes = IndexedMap.create();
	let materials = IndexedMap.create();
	let shaders = IndexedMap.create();
	let textures = IndexedMap.create();

	// Note: clears all resources - any uncleared existing scenes will break
	exports.clearResources = function() {
		meshes.clear();
		materials.clear();
		shaders.clear();
		textures.clear();
	};

	// TODO: Add clearUnusedResources - which enumerates through scene renderObjects / prefab instances 
	// to check objects are used or reference count them - will need to track created scenes

	// glState Tracking - shared across scenes
	let currentShaderId, currentMaterialId, currentMeshId, pMatrixRebound = false;
	let nextTextureLocation = 0, currentTextureBindings = {}, currentTextureLocations = [];	// keyed on texture.id to binding location, keyed on binding location to texture.id

	exports.create = function({ camera, enableFrustumCulling, forceSphereCulling }) {
		let cameras = {};
		let cameraNames = [];
		let mainCameraName = "main";
		// mvMatrix may need to be a stack in future (although a stack which avoids unnecessary mat4.creates)
		let pMatrix = mat4.create(), mvMatrix = mat4.create(), nMatrix = mat3.create(), cameraMatrix = mat4.create(), cameraOffset = vec3.create(), inverseCameraRotation = quat.create();
		

		let scene = {};
		scene.id = (nextSceneId++).toString();
		scene.enableFrustumCulling = !!enableFrustumCulling;

		// these renderObjects / instances on prefabs need to contain at minimum materialId, meshId, and transform (currently object just has material and mesh as well as transform)
		let renderObjects = IndexedMap.create(); // TODO: use materialId / meshId to bind
		let prefabs = { keys: [] };	// Arguably instances could be added to renderer objects and memory would still be saved, however keeping a separate list allows easier batching for now
		// TODO: Should have an equivilent to indexedMap but where you supply the keys, keyedMap?.
		let alphaRenderObjects = [];
		let depths = {};
		depths.get = (o) => {
			let id = o.sceneId !== undefined ? o.sceneId : o.id;
			return depths[id];
		};
		depths.set = (o, depth) => {
			let id = o.sceneId !== undefined ? o.sceneId : o.id;
			depths[id] = depth;
		};

		let addTexturesToScene = function(material) {
			for (let i = 0, l = material.shader.textureUniformNames.length; i < l; i++) {
				let uniformName = material.shader.textureUniformNames[i];
				let texture = material.textures[uniformName];
				if (texture) {
					textures.add(texture);
					bindTextureToLocation(texture);
				}

			}
		};

		let bindTextureToLocation = function(texture) {
			if (currentTextureBindings[texture.id] === undefined) {
				if (currentTextureLocations.length < r.TextureLocations.length) {
					r.setTexture(currentTextureLocations.length, texture);
					currentTextureBindings[texture.id] = currentTextureLocations.length;
					currentTextureLocations.push(texture.id);
				} else {
					// replace an existing texture
					delete currentTextureBindings[currentTextureLocations[nextTextureLocation]];
					r.setTexture(nextTextureLocation, texture);
					currentTextureBindings[texture.id] = nextTextureLocation;
					currentTextureLocations[nextTextureLocation] = texture.id;
					nextTextureLocation = (nextTextureLocation+1) % r.TextureLocations.length;
				}
			}
		};

		let addToAlphaList = function(object, depth) {
			// TODO: Profile using Array sort instead of insertion sorting, also test add/remove from list rather than clear
			depths.set(object, depth);
			// Binary search
			// Could technically do better by batching up items with the same depth according to material / mesh like scene graph
			// However this is only relevant for 2D games with orthographic projection
			let less, more, itteration = 1, inserted = false, index = Math.floor(alphaRenderObjects.length/2);
			while (!inserted) {
				less = (index === 0 || depths.get(alphaRenderObjects[index-1]) <= depth);
				more = (index >= alphaRenderObjects.length || depths.get(alphaRenderObjects[index]) >= depth);
				if (less && more) {
					alphaRenderObjects.splice(index, 0, object);
					inserted = true;
				} else {
					itteration++;
					var step = Math.ceil(alphaRenderObjects.length/(2*itteration));
					if(!less) {
						index = Math.max(0, index - step);
					} else {
						index = Math.min(alphaRenderObjects.length, index + step);
					}
				}
			}
		};

		let createObjectBounds = function(object, mesh, rotation) {
			// If object is static and not rotated, create object AABB from mesh bounds
			if (!forceSphereCulling && object.static && (!rotation || Maths.quatIsIdentity(rotation))) {
				// TODO: Allow for calculation of AABB of rotated meshes
				let center = vec3.clone(mesh.bounds.center);
				vec3.add(center, center, object.transform.position);
				let size = vec3.clone(mesh.bounds.size);
				object.bounds = Bounds.create({ center: center, size: size });
			}
		};

		let isCulledByFrustrum = function(camera, object) {
			if (!object.static || !object.bounds) {
				return !camera.isSphereInFrustum(object.transform.position, object.mesh.boundingRadius);
			} else {
				return !camera.isInFrustum(object.bounds);
			}
		};

		let sortByMaterial = function(a, b) {
			if (a.materialId == b.materialId) {
				return 0;
			} else if (a.materialId < b.materialId) { // Note: will not order strings by their parsed numberical value, however this is not required.
				return +1;
			} else {
				return -1;
			}
		};

		// Add Render Object
		scene.add = function(config) {
			let object = {};
			
			let { mesh, material, static = false, active = true } = config;
			object.material = material;
			object.mesh = mesh;
			if (!mesh || !material) {
				throw new Error("Mesh and Material must be present on the object.");
			}

			// Note: indexedMap.add adds id property to object added and does not add duplicates
			object.meshId = meshes.add(object.mesh);
			object.materialId = materials.add(object.material);
			object.shaderId = shaders.add(object.material.shader); 
			object.material.shaderId = object.shaderId;
			addTexturesToScene(object.material);

			object.transform = Transform.create(config);

			// For now just sort by material on add
			// Ideally would group materials with the same shader and textures together
			object.sceneId = renderObjects.add(object, sortByMaterial); 
			// Would probably be more performant to dynamic changes if kept a record of start and end index
			// of all materials and could simply inject at the correct point - TODO: Profile
			object.static = static;
			object.active = active;

			createObjectBounds(object, object.mesh, object.transform.rotation);

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

		scene.clear = function() {
			// Note: This does not free up the resources (e.g. mesh and material references remain) in the scene, may need to reference count these and delete
			renderObjects.clear();
			alphaRenderObjects.length = 0;
			if (prefabs.keys.length) {
				// Recreate prefab object - i.e. remove all prefabs and instances in one swoop.
				prefabs = { keys: [] }; 
			}
		};

		// Instantiate prefab instance
		scene.instantiate = function(config) {
			let prefab;

			if (!config || !config.name || !Prefab.prefabs[config.name]) {
				throw new Error("You must provide a valid prefab name");
			}

			let name = config.name;
			if (!prefabs[name]) {
				let defn = Prefab.prefabs[name];
				if (!defn.materialConfig || !defn.meshConfig) {
					throw new Error("Requested prefab must have a material and a mesh config present");
				}
				prefab = {
					name: name,
					instances: IndexedMap.create(),
					mesh: Mesh.create(defn.meshConfig),
					material: Material.create(defn.materialConfig)
				};
				prefab.meshId = meshes.add(prefab.mesh);
				prefab.materialId = materials.add(prefab.material);
				prefab.shaderId = shaders.add(prefab.material.shader);
				prefab.material.shaderId = prefab.shaderId;
				addTexturesToScene(prefab.material);
				prefabs[name] = prefab;
				prefabs.keys.push(name);
			} else {
				prefab = prefabs[name];
			}
			let instance = Object.create(prefab);
			instance.transform = Transform.create(config);

			let { static = false, active = true } = config;
			instance.id = prefab.instances.add(instance);
			instance.static = static;
			instance.active = active;

			createObjectBounds(instance, prefab.mesh, instance.transform.rotation);

			return instance;
		};

		// Add Camera
		// Arguably camera.render(scene) would be a preferable pattern
		scene.addCamera = function(camera, name) {
			let key = name ? name : "main";
			if (cameraNames.length === 0) {
				mainCameraName = key;
			}
			if (!cameras[key]) {
				cameraNames.push(key);
			}
			cameras[key] = camera;
		};

		// Render
		scene.render = function(cameraName) {
			let camera = cameras[cameraName ? cameraName : mainCameraName];
			if (scene.enableFrustumCulling) {
				camera.calculateFrustum();
			}
			camera.getProjectionMatrix(pMatrix);
			// Camera Matrix should transform world space -> camera space
			quat.invert(inverseCameraRotation, camera.rotation);						// TODO: Not quite sure about this, camera's looking in -z but THREE.js does it so it's probably okay
			mat4.fromQuat(cameraMatrix, inverseCameraRotation);
			mat4.translate(cameraMatrix, cameraMatrix, vec3.set(cameraOffset, -camera.position[0], -camera.position[1], -camera.position[2]));

			pMatrixRebound = false;
			alphaRenderObjects.length = 0; 

			// TODO: Scene Graph
			// Batched first by Shader
			// Then by Material
			// Then by Mesh
			// Then render each Mesh Instance
			// An extension would be to batch materials such that shaders that textures used overlap

			// This batching by shader / material / mesh may need to be combined with scene management techniques
			if (camera.clear) {
				r.clear();
			} else if (camera.clearDepth) {
				r.clearDepth();
			}

			// TODO: Scene graph should provide these as a single thing to loop over, will then only split and loop for instances at mvMatrix binding / drawing
			// Scene Graph should be class with enumerate() method, that way it can batch as described above and sort watch its batching / visibility whilst providing a way to simple loop over all elements
			let culled = false, renderObject = null;
			for (let i = 0, l = renderObjects.keys.length; i < l; i++) {
				// TODO: Detect if resorting is necessary (check +1 and -1 in array against sort function)
				renderObject = renderObjects[renderObjects.keys[i]];
				if (scene.enableFrustumCulling) {
					culled = isCulledByFrustrum(camera, renderObject);
				}
				if (!culled && renderObject.active) {
					if(renderObject.material.alpha) {
						let sortPosition = renderObject.transform.position
						if (renderObject.bounds) {
							sortPosition = renderObject.bounds.center;
						}
						addToAlphaList(renderObject, camera.getDepth(sortPosition));
					} else {
						bindAndDraw(renderObject);
					}
				}
			}
			for (let i = 0, l = prefabs.keys.length; i < l; i++) {
				let instances = prefabs[prefabs.keys[i]].instances;
				for (let j = 0, n = instances.keys.length; j < n; j++) {
					let instance = instances[instances.keys[j]];
					if (scene.enableFrustumCulling) {
						culled = isCulledByFrustrum(camera, instance);
					}
					if (!culled && instance.active) {
						if (instance.material.alpha) {
							let sortPosition = instance.transform.position;
							if (instance.bounds) {
								sortPosition = instance.bounds.center;
							}
							addToAlphaList(instance, camera.getDepth(sortPosition));
						} else {
							bindAndDraw(instance);
						}
					}
				}
			}
			for (let i = 0, l = alphaRenderObjects.length; i < l; i++) {
				renderObject = alphaRenderObjects[i];
				let m = renderObject.material; 
				// Could probably do this in bind and draw method
				if (!m.blendSeparate) {
					r.enableBlending(m.sourceBlendType, m.destinationBlendType, m.blendEquation);
				} else {
					r.enableSeparateBlending(m.sourceColorBlendType, m.destinationColorBlendType, m.sourceAlphaBlendType, m.destinationAlphaBlendType, m.blendEquation);
				}
				bindAndDraw(renderObject);
			}
			r.disableBlending();
		};

		let bindAndDraw = function(object) {
			let shader = object.material.shader;
			let material = object.material;
			let mesh = object.mesh;
			// BUG:
			// If there's only one material or one mesh in the scene real time changes to the material or mesh will not present themselves as the id will still match the currently bound
			// mesh / material, seems like we're going need a flag on mesh / material for forceRebind for this case. (should probably be called forceRebind as it 'might' be rebound anyway)
			// Having now determined that actually we don't need to rebind uniforms when switching shader programs, we'll need this flag whenever there's only one mesh or material using a given shader.

			// TODO: When scene graph implemented - check material.shaderId & object.shaderId against shader.id, and object.materialId against material.id and object.meshId against mesh.id
			// as this indicates that this object needs reordering in the graph (as it's been changed).

			let shouldRebindShader = false;
			let shouldRebindMaterial = false;
			if (!shader.id || shader.id != currentShaderId) {
				shouldRebindShader = true;
				// Check if shader was changed on the material since originally added to scene
				if(!shader.id) {
					material.shaderId = shaders.add(shader);
					object.shaderId = material.shaderId;
				} else {
					if (material.shaderId != shader.id) {
						material.shaderId = shader.id;
					} 
					if (object.shaderId != shader.id) {
						object.shaderId = shader.id;
					}
				}
				currentShaderId = shader.id;
				r.useShaderProgram(shader.shaderProgram);
				pMatrixRebound = false;
			}

			if (!pMatrixRebound) {
				// New Shader or New Frame, rebind projection Matrix
				r.setUniformMatrix4(shader.pMatrixUniformName, pMatrix);
				pMatrixRebound = true;
			}

			if (!material.id || material.id != currentMaterialId || material.dirty) {
				if (!material.dirty) {
					shouldRebindMaterial = true;
				} else {
					material.dirty = false;
				}
				// check if material was changed on object since originally 
				// added to scene TODO: Ideally would mark object for resorting
				if (!material.id) {
					object.materialId = materials.add(material);
				} else if (object.materialId != material.id) {
					object.materialId = material.id;
				}
				currentMaterialId = material.id;
				shader.bindMaterial.call(r, material);
			}

			if (shouldRebindShader || shouldRebindMaterial) {
				// Texture Rebinding dependencies
				// If the shader has changed you DON'T need to rebind, you only need to rebind if the on the uniforms have changed since the shaderProgram was last used...
					// NOTE Large Changes needed because of this
					// I think we're just going to have to add a flag to materials and meshes to say "rebind" (because I've changed something)
					// This also means we should move the "currentMeshId / currentMaterial id to the shader instead or keep a keyed list on shader the id
					// Lets do this after we've done the texture binding though eh? so for now just rebind everything if shader or material changes (overkill but it'll work)
				// If the material has changed textures may need rebinding

				// Check for gl location rebinds needed, if any needed and rebind all to make sure we don't replace a texture we're using
				let locationRebindsNeeded = false, uniformName = null, texture = null;
				for (let i = 0, l = shader.textureUniformNames.length; i < l; i++) {
					uniformName = shader.textureUniformNames[i];
					if (material.textures[uniformName]) {
						texture = material.textures[uniformName];
						if (!texture.id) {
							textures.add(texture);
							locationRebindsNeeded = true;
							break;
						}
						if (isNaN(currentTextureBindings[texture.id])) {
							locationRebindsNeeded = true;
							break;
						}
					}
				}
				// Rebind if necessary and set uniforms
				for (let i = 0, l = shader.textureUniformNames.length; i < l; i++) {
					uniformName = shader.textureUniformNames[i];
					if (material.textures[uniformName]) {
						texture = material.textures[uniformName];
						if (locationRebindsNeeded) {
							bindTextureToLocation(texture);
						}
						r.setUniformInteger(uniformName, currentTextureBindings[texture.id]);
					}
				}
			}

			if (!mesh.id || mesh.id != currentMeshId || mesh.dirty) {
				// Check if mesh was changed on object since originally added to scene
				if (!mesh.id) {
					object.meshId = mesh.add(mesh);
				} else if (object.meshId != mesh.id) {
					object.meshId = mesh.id;
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

		if (camera) {
			scene.addCamera(camera);
		}

		return scene;
	};

	return exports;
})();