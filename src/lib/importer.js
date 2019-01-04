
import { GLTF_VERSION, COMPONENT, VALID_ACCESSOR_TYPES, PROJECTION, TARGET } from './core/constants';
import scene from './graph/scene';
import node from './graph/node';

import camera from './core/camera';
import light from './core/light';

import mesh from './mesh/mesh';
import primitive from './mesh/primitive';
import accessor from './mesh/accessor';
import bufferView from './mesh/bufferView';

import sampler from './material/sampler';
import texture from './material/texture';
import material from './material/material';

const SUPPORTED_VERSION = GLTF_VERSION.split('.').map(a => parseInt(a));

export default async (url) => {

    const basePath = url.substring(0, url.lastIndexOf('/') + 1);

    const gltf = await fetch(url).then(res => res.json());

    let version = (gltf.asset.minVersion ? gltf.asset.minVersion : gltf.asset.version).split('.').map(a => parseInt(a));

    if (SUPPORTED_VERSION[0] !== version[0]) {
        // TODO: give feedback, major version is incompatible.
        return null;
    }

    if (gltf.asset.minVersion && SUPPORTED_VERSION[1] < version[1]) {
        // TODO: give feedback, minor version is incompatible.
        return null;
    }


    let buffers = [];
    if (gltf.buffers) {
        buffers = await Promise.all(gltf.buffers.map(({ uri }) => {
            if (uri.startsWith('data:')) {
                return fetch(uri).then(res => res.arrayBuffer());
            } else {
                return fetch(basePath + uri).then(res => res.arrayBuffer());
            }
        }));
    }

    let bufferViews = [];
    if (gltf.bufferViews) {

        bufferViews = gltf.bufferViews.map(({
            buffer: bufferIndex,
            byteLength,
            byteOffset,
            target,
            byteStride
        }) => {

            return bufferView(buffers[bufferIndex], byteLength, byteOffset, target, byteStride);

        });
    }

    let accessors = [];
    if (gltf.accessors) {
        accessors = gltf.accessors.map(({
            bufferView: bufferViewIndex,
            componentType,
            type,
            count,
            min,
            max,
            byteOffset
        }) => {

            if (componentType === COMPONENT.TYPE.FLOAT) {
                if (min) {
                    min = min.map(a => Math.fround(a));
                }
                if (max) {
                    max = max.map(a => Math.fround(a));
                }
            }

            return accessor(bufferViews[bufferViewIndex], componentType, type, count, min, max, byteOffset);

        });
    }

    let images = [];
    if (gltf.images) {
        images = await Promise.all(gltf.images.map(({
            uri,
            bufferView,
            mimeType
        }) => {
            if (uri && mimeType) {

                const image = new Image();
                image.src = basePath + uri;
                return new Promise((resolve, reject) => {
                    image.onload = resolve.bind(null, image);
                    image.onerror = reject;
                });

                //return fetch(basePath + uri, { headers: { 'content-type': mimeType } }).then(res => res.blob());

            } else {

                const bv = bufferViews[bufferView];
                const buffer = new DataView(bv.buffer, bv.byteOffset, bv.byteLength);
                const blob = new Blob([buffer], { type: mimeType });

                const image = new Image();
                image.src = URL.createObjectURL(blob);
                return new Promise((resolve, reject) => {
                    image.onload = resolve.bind(null, image);
                    image.onerror = reject;
                });

            }
        }));
    }

    let samplers = [];
    if (gltf.samplers) {
        samplers = gltf.samplers.map(s => sampler(s));
    }

    let textures = [];
    if (gltf.textures) {
        textures = gltf.textures.map(({ source: sourceIndex, sampler: samplerIndex, name }) => {

            const image = images[sourceIndex];

            let sampler_instance = sampler();
            if (samplerIndex) {
                sampler_instance = samplers[samplerIndex];
            }

            return texture({ source: image, sampler: sampler_instance }, name);
        });
    }

    let materials = [];
    if (gltf.materials) {
        materials = gltf.materials.map(({
            pbrMetallicRoughness,
            normalTexture,
            occlusionTexture,
            emissiveTexture,
            emissiveFactor,
            alphaMode,
            alphaCutoff,
            doubleSided,
            name
        }) => {

            // extract pbr parameters.
            const {
                baseColorFactor,
                baseColorTexture,
                metallicFactor,
                roughnessFactor,
                metallicRoughnessTexture
            } = pbrMetallicRoughness;

            // setup base-params
            const parameters = {
                baseColorFactor,
                metallicFactor,
                roughnessFactor,
                emissiveFactor,
                alphaMode,
                alphaCutoff,
                doubleSided
            };

            // add textures if they are defined:

            if (baseColorTexture) {
                const { index, texCoord } = baseColorTexture;
                parameters.baseColorTexture = {
                    texCoord,
                    texture: textures[index]
                };
            }

            if (metallicRoughnessTexture) {
                const { index, texCoord } = metallicRoughnessTexture;
                parameters.metallicRoughnessTexture = {
                    texCoord,
                    texture: textures[index]
                };
            }

            if (normalTexture) {
                const { scale, index, texCoord } = normalTexture;
                parameters.normalTexture = {
                    scale,
                    texCoord,
                    texture: textures[index]
                };
            }

            if (occlusionTexture) {
                const { strength, index, texCoord } = occlusionTexture;
                parameters.occlusionTexture = {
                    strength,
                    texCoord,
                    texture: textures[index]
                };
            }

            if (emissiveTexture) {
                const { index, texCoord } = emissiveTexture;
                parameters.emissiveTexture = {
                    texCoord,
                    texture: textures[index]
                };
            }

            // finally construct a material instance.
            return material(parameters, name);
        });
    }

    function createPrimitive({ attributes: attributeIndices, mode, material: materialIndex, indices: indicesIndex }) {

        let attributes = {};

        for (let key in attributeIndices) {

            let accessor = accessors[attributeIndices[key]];

            attributes[key] = accessor;

            if (
                (VALID_ACCESSOR_TYPES[key] &&
                    VALID_ACCESSOR_TYPES[key].type.includes(accessor.type) &&
                    VALID_ACCESSOR_TYPES[key].componentType.includes(accessor.componentType))
                === false
            ) {
                throw Error('GLTF2.0: Accessor is invalid.');
            }
        }

        const indices = accessors[indicesIndex];

        if (!VALID_ACCESSOR_TYPES.INDEX.type.includes(indices.type) || !VALID_ACCESSOR_TYPES.INDEX.componentType.includes(indices.componentType)) {
            throw Error('GLTF2.0: Indices accessor should have componentType { 5121, 5123, 5125 }, and type "SCALAR".');
        }

        const ibv = indices.bufferView;

        if (ibv.target && ibv.target !== TARGET.ELEMENT_ARRAY_BUFFER) {
            console.log(ibv.target);
            throw Error('GLTF2.0: Indices accessor should have a target equal to 34963 (ELEMENT_ARRAY_BUFFER).');
        }


        return primitive(attributes, mode, materials[materialIndex], indices);

    }

    let meshes = [];
    if (gltf.meshes) {
        meshes = gltf.meshes.map(({
            primitives: primitiveObjects,
            name
        }) => {

            let primitives = primitiveObjects.map((object) => createPrimitive(object));

            return mesh(primitives, name);

        });
    }


    let cameras = [];
    if (gltf.cameras) {
        cameras = gltf.cameras.map(({
            type,
            orthographic: orthographicProperties,
            perspective: perspectiveProperties
        }) => {

            if (type === PROJECTION.ORTHOGRAPHIC) {
                const { xmag, ymag, zfar, znear } = orthographicProperties;
                return camera.createOrthographic(xmag, ymag, zfar, znear);
            } else if (type === PROJECTION.PERSPECTIVE) {
                const { aspectRatio, yfov, zfar, znear } = perspectiveProperties;
                return camera.createPerspective(aspectRatio, yfov, zfar, znear);
            } else {
                // TODO: type not defined, throw?
                return null;
            }

        });
    }

    let lights = [];
    if (typeof gltf.extensionsUsed !== 'undefined' && gltf.extensionsUsed.includes('KHR_lights_punctual')) {
        lights = gltf.extensions.KHR_lights_punctual.lights.map(({
            color,
            intensity,
            type,
            range,
            spot
        }) => {
            if (type === 'directional') {
                return light.createDirectional(intensity, color);
            } else if (type === 'point') {
                return light.createPoint(intensity, color, range);
            } else {
                return light.createSpot(intensity, color, range, spot.innerConeAngle, spot.outerConeAngle);
            }
        });
    }

    // Note:
    // We assume that the nodes form a disjoint union of strict trees, as described in the specification.
    function createNode(index) {
        let {
            name,

            rotation,
            translation,
            scale,
            matrix,

            mesh: meshIndex,
            camera: cameraIndex,

            children: childIndices = [],

            extensions

        } = gltf.nodes[index];

        let light = null;
        if (typeof extensions !== 'undefined' && typeof extensions.KHR_lights_punctual !== 'undefined') {
            light = lights[extensions.KHR_lights_punctual.light];
        }

        return node({
            mesh: meshes[meshIndex],
            camera: cameras[cameraIndex],
            light,
            rotation,
            translation,
            scale,
            matrix,

            // recusively create nodes for the children.
            children: childIndices.map((index) => createNode(index))
        }, name);

    }

    let scenes = [];
    if (gltf.scenes) {
        scenes = gltf.scenes.map(({
            nodes: nodeIndices,
            name
        }) => {

            return scene(nodeIndices.map((index) => createNode(index)), name);

        });
    }

    return {
        scene: scenes[gltf.scene],
        scenes
    };
};