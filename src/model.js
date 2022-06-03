const { vec3, quat } = require('./maths');
const Transform = require('./transform');
const Mesh = require('./mesh');
const Texture = require('./texture');
const Material = require('./material');

module.exports = (function() {
	let exports = {};

	let buildMeshData = (json, meshIndex, buffers) => {
		let meshData = {};

		// TODO: Load TANGENT, JOINTS_n & WEIGHTS_n once supported by Fury.Mesh
		// c.f. https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#meshes-overview

		let primitive = json.meshes[meshIndex].primitives[0];
		// TODO: Consider support for multiple primitives
		// Note createSceneHierarchy has single primitive assumption baked

		let attributes = primitive.attributes;
		let positionIndex = attributes.POSITION;	// index into accessors
		let normalsIndex = attributes.NORMAL;		// index into accessors
		let uvIndex = attributes.TEXCOORD_0;		// index into accessors
		// TODO: Load all sets of texture coordinates
		let colorIndices = [];

		let propertyName = "COLOR_";
		let propertyNameIndex = 0;
		while (attributes.hasOwnProperty(propertyName + propertyNameIndex)) {
			colorIndices.push(attributes[propertyName + propertyNameIndex]);
			propertyNameIndex++;
		}

		let indicesIndex = primitive.indices;
		// ^^ I think this is the index and not the index count, should check with a more complex / varied model

		// Calculate bounding radius
		let max = json.accessors[positionIndex].max;
		let min = json.accessors[positionIndex].min;
		let maxPointSqrDistance = max[0]*max[0] + max[1]*max[1] + max[2]*max[2];
		let minPointSqrDistance = min[0]*min[0] + min[1]*min[1] + min[2]*min[2];
		meshData.boundingRadius = Math.sqrt(Math.max(maxPointSqrDistance, minPointSqrDistance));

		let vertexCount = json.accessors[positionIndex].count;
		let positionBufferView = json.bufferViews[json.accessors[positionIndex].bufferView];

		let indexCount = json.accessors[indicesIndex].count;
		let indicesBufferView = json.bufferViews[json.accessors[indicesIndex].bufferView];

		let normalsCount, uvCount;
		let normalsBufferView, uvBufferView;

		if (normalsIndex !== undefined) {
			normalsCount = json.accessors[normalsIndex].count;
			normalsBufferView = json.bufferViews[json.accessors[normalsIndex].bufferView];
		}

		if (uvIndex !== undefined) {
			uvCount = json.accessors[uvIndex].count;
			uvBufferView = json.bufferViews[json.accessors[uvIndex].bufferView];
		}

		let colorsCounts = [];
		let colorsBufferViews = [];

		for (let i = 0, l = colorIndices.length; i < l; i++) {
			let colorIndex = colorIndices[i];
			let accessor = json.accessors[colorIndex];
			colorsCounts[i] = accessor.count;
			colorsBufferViews[i] = json.bufferViews[accessor.bufferView];
		}

		// TODO: pick typedarray type from accessors[index].componentType (5126 => Float32, 5123 => Int16 - see renderer.DataType)
		// TODO: Get size from data from accessors[index].type rather than hardcoding
		meshData.vertices = new Float32Array(buffers[positionBufferView.buffer], positionBufferView.byteOffset, vertexCount * 3);

		if (normalsIndex !== undefined) {
			meshData.normals = new Float32Array(buffers[normalsBufferView.buffer], normalsBufferView.byteOffset, normalsCount * 3);
		}

		if (uvIndex !== undefined) {
			meshData.textureCoordinates = new Float32Array(buffers[uvBufferView.buffer], uvBufferView.byteOffset, uvCount * 2);
		}

		meshData.indices = new Int16Array(buffers[indicesBufferView.buffer], indicesBufferView.byteOffset, indexCount);

		if(colorIndices.length > 0) {
			meshData.customAttributes = [];
			// Assumed componentType = 5126 => Float32, type = "VEC4" => count * 4
			for (let i = 0, l = colorIndices.length; i < l; i++) {
				let name = "COLOR_" + i; 
				meshData[name] = new Float32Array(buffers[colorsBufferViews[i].buffer], colorsBufferViews[i].byteOffset, colorsCounts[i] * 4);
				meshData.customAttributes.push({ name: name, source: name, size: 4 });
			}
		}

		return meshData;
	};

	let calculateArrayLength = (accessor) => {
		switch(accessor.type) {
			case "VEC4":
				return 4 * accessor.count;
			case "VEC3":
				return 3 * accessor.count;
			case "VEC2":
				return 2 * accessor.count;
			default: // "SCALAR"
				return accessor.count;
		}
	};

	let buildAnimationData = (out, json, animationIndex, buffers) => {
		let animation = json.animations[animationIndex];
		let result = {};

		result.name = animation.name;
		result.channels = [];
		result.duration = 0;

		for (let i = 0, l = animation.channels.length; i < l; i++) {
			let channel = animation.channels[i];
			
			let sampler = animation.samplers[channel.sampler];
			let times = []; // accessors at sampler.input
			let values = []; // accessors at sampler.output

			let timesAccessor = json.accessors[sampler.input];
			let timesBufferView = json.bufferViews[timesAccessor.bufferView];
			let valuesAccesor = json.accessors[sampler.output];
			let valuesBufferView = json.bufferViews[valuesAccesor.bufferView];

			result.duration = Math.max(result.duration, timesAccessor.max[0]);

			// Could assert target.path against accessor.type (translation => VEC3, rotation => VEC4, scale => VEC3)

			// Assuming float for now, should read from accessor.componentType
			// Note: needs transforming to float as per https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#animations
			times = new Float32Array(buffers[timesBufferView.buffer], timesBufferView.byteOffset, calculateArrayLength(timesAccessor));
			values = new Float32Array(buffers[valuesBufferView.buffer], valuesBufferView.byteOffset, calculateArrayLength(valuesAccesor));

			result.channels[i] = {
				type: channel.target.path,
				node: channel.target.node,
				times: times,
				values: values,
				interpolation: sampler.interpolation
			};
		}

		out[animation.name] = result;
	};

	let buildHierarchy = (json, index) => {
		let nodes = json.nodes;
		let { name, mesh, children, translation, rotation, scale } = nodes[index];

		let result = {};
		
		result.index = index;
		result.name = name;
		result.modelMeshIndex = mesh;
		if (!isNaN(mesh)) {
			result.modelMaterialIndex = json.meshes[mesh].primitives[0].material;
		}

		result.translation = translation;
		result.rotation = rotation;
		result.scale = scale;

		if (children) {
			result.children = [];
			for (let i = 0, l = children.length; i < l; i++) {
				let childNode = buildHierarchy(
					json,
					children[i]);
				result.children.push(childNode);
			}
		}

		return result;
	};

	let instantiateNode = (node, instance, resources, scene, parent) => {
		let transform = Transform.create({
			position: node.translation ? vec3.clone(node.translation) : vec3.create(),
			rotation: node.rotation ? quat.clone(node.rotation) : quat.create(),
			scale: node.scale ? vec3.clone(node.scale) : vec3.fromValues(1.0, 1.0, 1.0)
		});
		if (parent) {
			transform.parent = instance.transforms[parent.index];
		}
		instance.transforms[node.index] = transform;

		if (!isNaN(node.modelMeshIndex)) {
			let mesh = resources.meshes[node.modelMeshIndex];
			let material = resources.materials[node.modelMaterialIndex];
			// This breaks if the node doesn't have a modelMaterialIndex which is possible

			instance.sceneObjects.push(scene.add({
				material: material,
				mesh: mesh,
				transform: transform
			}));
		}

		let children = node.children;
		if (children) {
			transform.children = [];
			for (let i = 0, l = children.length; i < l; i++) {
				instantiateNode(
					children[i],
					instance,
					resources,
					scene,
					node);
				transform.children.push(instance.transforms[children[i].index]);
			}
		}

		return transform;
	};

	exports.instantiate = (model, scene, resources) => {
		if (!resources) {
			resources = model.resources;
		}
		if (!resources.meshes) {
			throw new Error("No mesh resources found to instantiate model, use Model.createResources to generate necessary Fury resources");
		}

		let instance = {};
		instance.sceneObjects = [];
		instance.transforms = [];
		instance.transform = instantiateNode(model.hierarchy, instance, resources, scene, null);
		return instance;
	};

	exports.createResources = (out, model, { shader, texturelessShader = null, quality }) => {
		out.textures = [];
		for (let i = 0, l = model.textureData.length; i < l; i++) {
			let imageIndex = model.textureData[i].imageIndex;
			out.textures[i] = Texture.create({
				source: model.images[imageIndex],
				quality: quality,
				flipY: false
			});
			out.textures[i].name = model.textureData[i].name;
		}

		out.materials = [];
		for (let i = 0, l = model.materialData.length; i < l; i++) {
			let textureIndex = model.materialData[i].textureIndex;
			if (textureIndex >= 0) {
				out.materials[i] = Material.create({ 
					shader: shader,
					texture: out.textures[textureIndex]
				});
			} else {
				out.materials[i] = Material.create({
					shader: texturelessShader ? texturelessShader : shader
				});
			}
		}

		out.meshes = [];
		for (let i = 0, l = model.meshData.length; i < l; i++) {
			out.meshes[i] = Mesh.create(model.meshData[i]);
		}
	};

	// Takes a URI of a glTF file to load
	// Returns an object containing an array meshdata ready for use with Fury.Mesh
	// As well as an array of images to use in material creation
	// Includes a cut down set of information on materialData and textureData arrays 
	// however these are not ready to be used directly with Fury.Material and Fury.Texture
	// and must be manipulated further, see exports.createResources
	exports.load = (uri, callback) => {
		// TODO: Check file extension, only gltf currently supported
		// https://github.com/KhronosGroup/glTF -> https://github.com/KhronosGroup/glTF/tree/master/specification/2.0
		// https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/figures/gltfOverview-2.0.0b.png
		// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html
		fetch(uri).then((response) => {
			return response.json();
		}).then((json) => {

			let model = { meshData: [], images: [], materialData: [], textureData: [] };
			let arrayBuffers = [];

			let assetsLoading = 0;
			let onAssetLoadComplete = () => {
				assetsLoading--;
				if (assetsLoading == 0) {
					// All buffers loaded so build mesh data
					for(let i = 0, l = json.meshes.length; i < l; i++) {
						model.meshData[i] = buildMeshData(json, i, arrayBuffers)
					}

					if (json.animations && json.animations.length) {
						model.animations = {};
						for (let i = 0, l = json.animations.length; i < l; i++) {
							buildAnimationData(model.animations, json, i, arrayBuffers);
						}
					}
					callback(model);
				}
			};

			for (let i = 0, l = json.buffers.length; i < l; i++) {
				assetsLoading++;
				fetch(json.buffers[i].uri).then((response) => {
					return response.arrayBuffer();
				}).then((buffer) => { 
					arrayBuffers[i] = buffer;
					onAssetLoadComplete();
				}).catch((error) => {
					console.error(error);
					console.error("Unable to fetch data buffer from model");
				});
			}

			// Hierarchy information
			if (json.scenes && json.scenes.length) {
				let scene = json.scenes[json.scene]; // Only one scene currently supported
				let nodeIndex = scene.nodes[0]; // Expect single scene node
				model.hierarchy = buildHierarchy(json, nodeIndex);
			}

			if (json.materials && json.materials.length) {
				// As PBR is not supported flatten the material structure
				for (let i = 0, l = json.materials.length; i < l; i++) {
					let textureIndex = -1;
					let material = json.materials[i];
					if (material.pbrMetallicRoughness 
						&& material.pbrMetallicRoughness.baseColorTexture) {
						let index = material.pbrMetallicRoughness.baseColorTexture.index; 
						textureIndex = !isNaN(index) ? index : -1;
					}

					// Only texture index is currently relevant
					model.materialData[i] = {
						textureIndex: textureIndex
					};
				}
			}

			if (json.textures && json.textures.length) {
				for (let i = 0, l = json.textures.length; i < l; i++) {
					let { sampler, source, name } = json.textures[i];
					// samplers not currently supported, so just put name and imageIndex
					model.textureData[i] = {
						name: name,
						imageIndex: source 
					};
				}
			}

			if (json.images && json.images.length) {
				for (let i = 0, l = json.images.length; i < l; i++) {
					assetsLoading++;
					fetch(json.images[i].uri).then(response => response.blob()).then(blob => {
						let image = new Image();
						image.src = URL.createObjectURL(blob);
						// Note if we wanted to unload the model
						// we would need to call URL.revokeObjectURL(image.src)
						image.decode().then(() => {
							model.images[i] = image;
							onAssetLoadComplete();
						}).catch((error) => {
							console.error(error);
							console.error("Unable to decode provide image data");
						});
					}).catch((error) => {
						console.error(error);
						console.error("Unable to fetch image data from model");
					});	
				}
			}
		}).catch((error) => {
			console.error(error);
			console.error("Unable to load model at " + uri);
		});
	};

	return exports;
})();
