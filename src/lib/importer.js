
import base64ToArrayBuffer from 'base64-arraybuffer';
import scene from './graph/scene';
import node from './graph/node';

import camera from './camera/camera';

import mesh from './mesh/mesh';
import primitive from './mesh/primitive';
import accessor from './mesh/accessor';
import bufferView from './mesh/bufferView';

const SUPPORTED_VERSION = '2.0'.split('.').map(a => parseInt(a));

export default (raw) => {

    const gltf = JSON.parse(raw);

    // Version check:

    let version = (gltf.asset.minVersion ? gltf.asset.minVersion : gltf.asset.version).split('.').map(a => parseInt(a));

    if (SUPPORTED_VERSION[0] !== version[0]) {
        // TODO: give feedback, major version is incompatible.
        return null;
    }

    if (gltf.asset.minVersion && SUPPORTED_VERSION[1] < version[1]) {
        // TODO: give feedback, minor version is incompatible.
        return null;
    }


    // Parsing:

    const buffers = gltf.buffers.map((b) => base64ToArrayBuffer.decode(b.uri.replace(/^(data:application\/octet-stream;base64,)/, '')));

    const bufferViews = gltf.bufferViews.map(({
        buffer: bufferIndex,
        byteLength,
        byteOffset,
        target,
        byteStride
    }) => {

        return bufferView(buffers[bufferIndex], byteLength, byteOffset, target, byteStride);

    });

    const accessors = gltf.accessors.map(({
        bufferView: bufferViewIndex,
        componentType,
        type,
        count,
        min,
        max,
        byteOffset
    }) => {

        return accessor(bufferViews[bufferViewIndex], componentType, type, count, min, max, byteOffset);

    });

    function createPrimitive({ attributes: attributeIndices, mode, indices: indicesIndex }) {

        let attributes = {};

        for (let key in attributeIndices) {
            attributes[key] = accessors[attributeIndices[key]];
        }

        // TODO: add material.
        return primitive(attributes, mode, null, accessors[indicesIndex]);

    }

    const meshes = gltf.meshes.map(({
        primitives: primitiveObjects,
        name
    }) => {

        let primitives = primitiveObjects.map((object) => createPrimitive(object));

        return mesh(primitives, name);

    });

    const cameras = gltf.cameras.map(({
        name,
        type,
        perspective,
        orthographic
    }) => {

        return camera({ type, name, perspective, orthographic });

    });

    // const nodes = gltf.nodes.map(({
    //     name,

    //     rotation,
    //     translation,
    //     scale,
    //     matrix,

    //     mesh: meshIndex,
    //     camera: cameraIndex,

    //     children: childIndices = []

    // }) => {

    //     return node({
    //         name,
    //         mesh: meshes[meshIndex],
    //         camera: cameras[cameraIndex],
    //         rotation,
    //         translation,
    //         scale,
    //         matrix,
    //         children: childIndices.map((index) => createNode(index))
    //     });

    // });

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

            children: childIndices = []

        } = gltf.nodes[index];

        return node({
            name,
            mesh: meshes[meshIndex],
            camera: cameras[cameraIndex],
            rotation,
            translation,
            scale,
            matrix,

            // recusively create nodes for the children.
            children: childIndices.map((index) => createNode(index))
        });

    }

    const scenes = gltf.scenes.map(({
        nodes: nodeIndices,
        name
    }) => {

        return scene(nodeIndices.map((index) => createNode(index)), name);

    });

    return {
        scene: scenes[gltf.scene],
        scenes
    };
};