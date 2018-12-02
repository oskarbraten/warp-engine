
import { mat4 } from 'gl-matrix';

import { ATTRIBUTE_LOCATION, TYPE, COMPONENT } from './constants';

import buildShaderFromSource from './shader-builder';
import basicVertexShaderSource from '../shaders/basic-vertex-shader.glsl';
import basicFragmentShaderSource from '../shaders/basic-fragment-shader.glsl';

function updateWorldMatrix(node) {

    if (node.parent !== null) {
        // Multiply the localMatrix of this node with the worldMatrix of its parent.
        mat4.multiply(node.worldMatrix, node.parent.worldMatrix, node.matrix);
    } else {
        //Just set the localMatrix as the worldMatrix since this node does not have a parent
        mat4.copy(node.worldMatrix, node.matrix);
    }

    node.needsUpdate = false;

    // Propagate the update downwards in the scene tree 
    //(the children will use this node's worldMatrix in the tick)
    for (let i = 0; i < node.children.length; i++) {
        updateWorldMatrix(node.children[i]);
    }

}

function initializeContext(width, height) {

    const gl = document.createElement('canvas').getContext('webgl2');

    const domElement = gl.canvas;
    domElement.width = width;
    domElement.height = height;

    if (!gl) {
        throw Error('WebGL 2.0 isn\'t available');
    }

    gl.viewport(0, 0, domElement.width, domElement.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    return gl;

}

export default (width, height) => {

    let gl = initializeContext(width, height);

    const program = buildShaderFromSource(gl, basicVertexShaderSource, basicFragmentShaderSource);
    gl.useProgram(program);

    let realm = {

        gl,

        buffers: [],
        bufferViews: [],
        accessors: [],
        cameras: [],
        meshes: [],
        nodes: [],
        scenes: [],

        scene: null,

        updateTransforms() {

            const nodes = this.scenes[this.scene].nodes;

            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].needsUpdate) {

                    updateWorldMatrix(nodes[i]);

                }
            }

        },

        acquireRenderQueue() {

            // TODO: perform frustum culling based on camera (passed as parameter)

            let drawables = [];

            for (let i = 0; i < this.nodes.length; i++) {

                const node = this.nodes[i];

                if (typeof node.mesh !== 'undefined') {

                    for (let j = 0; j < this.meshes[node.mesh].primitives.length; j++) {

                        drawables.push([
                            this.meshes[node.mesh].primitives[j],
                            node.worldMatrix
                        ]);
    
                    }

                }

            }

            // TODO: perform sorting, front to back, transparency, material-id, etc..

            return drawables;

        },

        loadFromGLTF(document, setScene = false) {

            this.buffers = document.buffers;
            this.bufferViews = document.bufferViews;
            this.accessors = document.accessors;
            this.cameras = document.cameras;
            this.meshes = document.meshes;
            this.nodes = document.nodes;
            this.scenes = document.scenes;

            if (setScene) {
                this.scene = document.scene;
            }

            for (let i = 0; i < this.meshes.length; i++) {
                for (let j = 0; j < this.meshes[i].primitives.length; j++) {

                    this.load(this.meshes[i].primitives[j]);

                }
            }

        },
        
        /**
         * 
         * @param {*} n Primitive
         */
        load(primitive) {

            if (primitive.vao) {

                // the primitive has already been loaded.
                return;

            }

            // setup VAO:

            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            if (primitive.indices) {

                let accessor = this.accessors[primitive.indices];
                let bufferView = this.bufferViews[accessor.bufferView];

                if (bufferView.element_array_buffer) {

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferView.element_array_buffer);

                    // the bufferView is already loaded, increment access count.
                    bufferView.bufferAccessCount += 1;

                } else {

                    // create buffer and upload data.

                    let buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

                    let dataView = new DataView(this.buffers[bufferView.buffer], bufferView.byteOffset, bufferView.byteLength);

                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, dataView, gl.STATIC_DRAW);

                    bufferView.element_array_buffer = buffer;
                    bufferView.bufferAccessCount = 1; // number of accessors linking to this buffer.

                }

            }

            // create and link attribute accessors, and possibly upload bufferView to GPU.

            for (let name in primitive.attributes) {

                let accessor = this.accessors[primitive.attributes[name]];
                let bufferView = this.bufferViews[accessor.bufferView];

                console.log(accessor, bufferView);

                if (bufferView.array_buffer) {

                    gl.bindBuffer(gl.ARRAY_BUFFER, bufferView.array_buffer);

                    // the bufferView is already loaded, increment access count.
                    bufferView.bufferAccessCount += 1;

                } else {

                    // create buffer and upload data.

                    let buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

                    let dataView = new DataView(this.buffers[bufferView.buffer], bufferView.byteOffset, bufferView.byteLength);

                    gl.bufferData(gl.ARRAY_BUFFER, dataView, gl.STATIC_DRAW);

                    // setup and enable vertex attributes (Using the predefined and constant locations.)
                    gl.vertexAttribPointer(ATTRIBUTE_LOCATION[name], TYPE[accessor.type], accessor.componentType, accessor.normalized, bufferView.byteStride, accessor.byteOffset);
                    gl.enableVertexAttribArray(ATTRIBUTE_LOCATION[name]);

                    bufferView.array_buffer = buffer;
                    bufferView.bufferAccessCount = 1; // number of accessors linking to this buffer.

                }
            }

            primitive.vao = vao;

        },

        draw(drawable, viewMatrix) {

            const primitive = drawable[0];
            const worldMatrix = drawable[1];
            
            let modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, worldMatrix);

            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), false, modelViewMatrix);

            if (primitive.vao) {

                gl.bindVertexArray(primitive.vao);

                if (primitive.indices) {

                    const offset = primitive.indices.byteOffset / COMPONENT.SIZE[primitive.indices.componentType];
                    gl.drawElements(primitive.mode, primitive.indices.count, primitive.indices.componentType, offset);

                } else {

                    gl.drawArrays(gl.TRIANGLES, 0, primitive.attributes.POSITION.count / 3);

                }

            } else {

                throw Error('Attempted to draw primitive with no VAO (Is the mesh loaded?).');

            }

        },

        render(renderQueue, cameraNode) {

            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const camera = this.cameras[cameraNode.camera];
            const projectionMatrix = mat4.perspective(mat4.create(), camera.perspective.yfov, camera.perspective.aspectRatio, camera.perspective.znear, camera.perspective.zfar);
            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, projectionMatrix);

            const viewMatrix = mat4.invert(mat4.create(), cameraNode.worldMatrix);

            for (let i = 0; i < renderQueue.length; i++) {
                this.draw(renderQueue[i], viewMatrix);
            }

        },

    };



    return realm;

};