import { mat4, vec3, quat } from 'gl-matrix';

const GLTF_VERSION = '2.0';
const SUPPORTED_VERSION = GLTF_VERSION.split('.').map(a => parseInt(a));

export default async (raw) => {

    const document = JSON.parse(raw);

    let version = (document.asset.minVersion ? document.asset.minVersion : document.asset.version).split('.').map(a => parseInt(a));

    if (SUPPORTED_VERSION[0] !== version[0]) {
        // TODO: give feedback, major version is incompatible.
        return null;
    }

    if (document.asset.minVersion && SUPPORTED_VERSION[1] < version[1]) {
        // TODO: give feedback, minor version is incompatible.
        return null;
    }

    // remove asset
    delete document.asset;


    // load buffers.
    document.buffers = await Promise.all(document.buffers.map(({ uri }) => {
        return fetch(uri).then(res => res.arrayBuffer()); // use fetch to gelt data from uri.
    }));

    document.nodes = document.nodes.map((node) => {
        if (!node.matrix) {

            let rotation = node.rotation ? quat.fromValues(...node.rotation) : quat.create();
            let translation = node.translation ? vec3.fromValues(...node.translation) : vec3.create();
            let scale = node.scale ? vec3.fromValues(...node.scale) : vec3.create();

            node.matrix = mat4.fromRotationTranslationScale(mat4.create(), rotation, translation, scale);

        } else {

            let matrix = mat4.fromValues(...node.matrix);
            node.matrix = matrix;

        }

        node.worldMatrix = mat4.create();
        node.needsUpdate = true;

        return node;

    });

    return document;
};