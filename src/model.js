module.exports = (function() {
	let exports = {};

	// Takes a URI of a glTF file to load
	// Returns an object containing an array meshdata ready for use with Fury.Mesh
	// As well as an array of images to use in material creation
	// In future can be extended to include material (texture + sampler) information from the model
	exports.load = (uri, callback) => {
		// TODO: Check file extension, only gltf currently supported
		// https://github.com/KhronosGroup/glTF -> https://github.com/KhronosGroup/glTF/tree/master/specification/2.0
		// https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/figures/gltfOverview-2.0.0b.png
		// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html

		let model = { meshData: [], images: [] };
		
		fetch(uri).then((response) => {
			return response.json();
		}).then((json) => {
			// Find first mesh and load it
			// TODO: Load all meshes
			// TODO: Load all sets of texture coordinates
			// TODO: Load TANGENT, JOINTS_n & WEIGHTS_n once supported by Fury.Mesh
			// c.f. https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#meshes-overview

			let meshData = {};

			let attributes = json.meshes[0].primitives[0].attributes;
			let positionIndex = attributes.POSITION;	// index into accessors
			let normalsIndex = attributes.NORMAL;		// index into accessors
			let uvIndex = attributes.TEXCOORD_0;		// index into accessors
			let colorIndices = [];

			let propertyName = "COLOR_";
			let propertyNameIndex = 0;
			while (attributes.hasOwnProperty(propertyName + propertyNameIndex)) {
				colorIndices.push(attributes[propertyName + propertyNameIndex]);
				propertyNameIndex++;
			}

			let indicesIndex = json.meshes[0].primitives[0].indices;
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

			if (positionBufferView.buffer != indicesBufferView.buffer) {
				console.error("Triangle Indices Buffer Index does not match Position Buffer Index");
			}

			let normalsCount, uvCount;
			let normalsBufferView, uvBufferView;

			if (normalsIndex !== undefined) {
				normalsCount = json.accessors[normalsIndex].count;
				normalsBufferView = json.bufferViews[json.accessors[normalsIndex].bufferView];
				if (positionBufferView.buffer != normalsBufferView.buffer) {
					console.error("Normals Buffer Index does not match Position Buffer Index");
				}
			}

			if (uvIndex !== undefined) {
				uvCount = json.accessors[uvIndex].count;
				uvBufferView = json.bufferViews[json.accessors[uvIndex].bufferView];
				if (positionBufferView.buffer != uvBufferView.buffer) {
					console.error("Texture Coordinates Buffer Index does not match Position Buffer Index");
				}
			}

			let colorsCounts = [];
			let colorsBufferViews = [];

			for (let i = 0, l = colorIndices.length; i < l; i++) {
				let colorIndex = colorIndices[i];
				let accessor = json.accessors[colorIndex];
				colorsCounts[i] = accessor.count;
				colorsBufferViews[i] = json.bufferViews[accessor.bufferView];
				if (positionBufferView.buffer != colorsBufferViews[i].buffer) {
					console.error("The COLOR_" + i +" Buffer Index does not match Position Buffer Index");
				}
			}

			let assetsLoading = 0;
			assetsLoading++;
			fetch(json.buffers[positionBufferView.buffer].uri).then((response) => {
				return response.arrayBuffer();
			}).then((arrayBuffer) => {
				// TODO: pick typedarray type from accessors[index].componentType (5126 => Float32, 5123 => Int16 - see renderer.DataType)
				// TODO: Get size from data from accessors[index].type rather than hardcoding
				meshData.vertices = new Float32Array(arrayBuffer, positionBufferView.byteOffset, vertexCount * 3);

				if (normalsIndex !== undefined) {
					meshData.normals = new Float32Array(arrayBuffer, normalsBufferView.byteOffset, normalsCount * 3);
				}

				if (uvIndex !== undefined) {
					meshData.textureCoordinates = new Float32Array(arrayBuffer, uvBufferView.byteOffset, uvCount * 2);
				}

				meshData.indices = new Int16Array(arrayBuffer, indicesBufferView.byteOffset, indexCount);

				if(colorIndices.length > 0) {
					meshData.customAttributes = [];
					// Assumed componentType = 5126 => Float32, type = "VEC4" => count * 4
					for (let i = 0, l = colorIndices.length; i < l; i++) {
						let name = "COLOR_" + i; 
						meshData[name] = new Float32Array(arrayBuffer, colorsBufferViews[i].byteOffset, colorsCounts[i] * 4);
						meshData.customAttributes.push({ name: name, source: name, size: 4 });
					}
				}

				model.meshData.push(meshData);
				assetsLoading--;

				if (assetsLoading == 0) {
					callback(model);
				}

			}).catch((error) => {
				console.error(error);
				console.error("Unable to fetch data buffer from model");
			});

			if (json.images && json.images.length) {
				// TODO: Load images and using the index from textures array instead of directly
				for (let i = 0, l = json.images.length; i < l; i++) {
					assetsLoading++;
					fetch(json.images[i].uri).then(response => response.blob()).then(blob => {
						let image = new Image();
						image.src = URL.createObjectURL(blob);
						// Note if we wanted to unload the model
						// we would need to call URL.revokeObjectURL(image.src)
						image.decode().then(() => {
							model.images.push(image);
							assetsLoading--;
							if (assetsLoading == 0) {
								callback(model);
							}
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
