
import { GLTF_VERSION, COMPONENT, VALID_ACCESSOR_TYPES } from './core/constants';
import scene from './graph/scene';
import node from './graph/node';

import orthographic from './camera/orthographic';
import perspective from './camera/perspective';

import mesh from './mesh/mesh';
import primitive from './mesh/primitive';
import accessor from './mesh/accessor';
import bufferView from './mesh/bufferView';

const SUPPORTED_VERSION = GLTF_VERSION.split('.').map(a => parseInt(a));


export default async (raw) => {

    const gltf = JSON.parse(raw);

    let version = (gltf.asset.minVersion ? gltf.asset.minVersion : gltf.asset.version).split('.').map(a => parseInt(a));

    if (SUPPORTED_VERSION[0] !== version[0]) {
        // TODO: give feedback, major version is incompatible.
        return null;
    }

    if (gltf.asset.minVersion && SUPPORTED_VERSION[1] < version[1]) {
        // TODO: give feedback, minor version is incompatible.
        return null;
    }


    const buffers = await Promise.all(gltf.buffers.map(({ uri }) => {
        return fetch(uri).then(res => res.arrayBuffer()); // use fetch to get data from uri.
    }));

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

        if (componentType === COMPONENT.TYPE.FLOAT) {
            min = min.map(a => Math.fround(a));
            max = max.map(a => Math.fround(a));
        }

        return accessor(bufferViews[bufferViewIndex], componentType, type, count, min, max, byteOffset);

    });

    function createPrimitive({ attributes: attributeIndices, mode, indices: indicesIndex }) {

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
        orthographic: orthographicProperties,
        perspective: perspectiveProperties
    }) => {

        if (type === 'orthograpic') {
            return orthographic(orthographicProperties, name);
        } else if (type === 'perspective') {
            return perspective(perspectiveProperties, name);
        } else {
            // TODO: type not defined, throw?
            return null;
        }

    });

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