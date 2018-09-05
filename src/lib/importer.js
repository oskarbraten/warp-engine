
import base64ToArrayBuffer from 'base64-arraybuffer';
import scene from './Scene';
import node from './Node';
import mesh from './Mesh';
import primitive from './Primitive';
import accessor from './Accessor';
import bufferView from './BufferView';

export default (raw) => {

    const gltf = JSON.parse(raw);
    const buffers = gltf.buffers.map((b) => base64ToArrayBuffer.decode(b.uri.replace(/^(data:application\/octet-stream;base64,)/, '')));

    function createBufferView(index) {
        let rbv = gltf.bufferViews[index];

        return bufferView(buffers[rbv.buffer], rbv.byteLength, rbv.byteOffset, rbv.target);
    }
    
    function createAccessor(index) {
        let ra = gltf.accessors[index];
    
        let bv = createBufferView(ra.bufferView);
    
        return accessor(bv, ra.componentType, ra.type, ra.count, ra.min, ra.max, ra.byteOffset);
    }
    
    function createPrimitive(props) {
        
        let attributes = {};
    
        for (let attribute in props.attributes) {
            attributes[attribute] = createAccessor(props.attributes[attribute]);
        }
    
        let indices = null;
        if (typeof props.indices !== 'undefined') {
            indices = createAccessor(props.indices);
        }
    
    
        return primitive(attributes, props.mode, null, indices);
    }
    
    function createMesh(index) {
        let rm = gltf.meshes[index];

        let primitives = rm.primitives.map((props) => createPrimitive(props));
    
        return mesh(primitives, rm.name);
    }
    
    function createNode(index) {
        let rn = gltf.nodes[index];
    
        let mesh = null;
        
        if (typeof rn.mesh !== 'undefined') {
            mesh = createMesh(rn.mesh);
        }
    
        return node(null, mesh, rn.name);
    }

    const result = {
        scenes: gltf.scenes.map((s) => scene(s.nodes.map((n) => createNode(n)), s.name))
    };

    result.scene = result.scenes[gltf.scene];

    return result;
};