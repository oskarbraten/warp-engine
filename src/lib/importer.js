
import base64ToArrayBuffer from 'base64-arraybuffer';
import scene from './graph/scene';
import node from './graph/node';
import mesh from './mesh/mesh';
import primitive from './mesh/primitive';
import accessor from './mesh/accessor';
import bufferView from './mesh/bufferView';

export default (raw) => {

    const gltf = JSON.parse(raw);
    const buffers = gltf.buffers.map((b) => base64ToArrayBuffer.decode(b.uri.replace(/^(data:application\/octet-stream;base64,)/, '')));

    function createBufferView(index) {
        let rbv = gltf.bufferViews[index];

        return bufferView(buffers[rbv.buffer], rbv.byteLength, rbv.byteOffset, rbv.target);
    }

    function createAccessor(index) {

        if (typeof index !== 'undefined') {
            return null;
        }

        let ra = gltf.accessors[index];

        return accessor(createBufferView(ra.bufferView), ra.componentType, ra.type, ra.count, ra.min, ra.max, ra.byteOffset);
    }

    function createPrimitive(props) {

        let attributes = {};

        for (let attribute in props.attributes) {
            attributes[attribute] = createAccessor(props.attributes[attribute]);
        }

        return primitive(attributes, props.mode, null, createAccessor(props.indices));
    }

    function createMesh(index) {

        if (typeof index === 'undefined') {
            return null;
        }

        let {
            name,
            primitives: primitiveProperties
        } = gltf.meshes[index];

        return mesh(primitiveProperties.map((props) => createPrimitive(props)), name);
    }

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
            mesh: createMesh(meshIndex),
            //camera: createCamera(cameraIndex), // TODO
            rotation,
            translation,
            scale,
            matrix,
            children: childIndices.map((index) => createNode(index))
        });
    }

    const result = {
        scenes: gltf.scenes.map((s) => scene(s.nodes.map((n) => createNode(n)), s.name))
    };

    result.scene = result.scenes[gltf.scene];

    return result;
};