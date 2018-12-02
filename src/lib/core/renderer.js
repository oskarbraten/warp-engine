
import { mat4 } from 'gl-matrix';

import { ATTRIBUTE_LOCATION, TYPE, COMPONENT } from './constants';

import buildShaderFromSource from './shader-builder';
import basicVertexShaderSource from '../shaders/basic-vertex-shader.glsl';
import basicFragmentShaderSource from '../shaders/basic-fragment-shader.glsl';

export default (width, height) => {

    const domElement = document.createElement('canvas');
    domElement.width = width;
    domElement.height = height;

    const gl = domElement.getContext('webgl2');

    if (!gl) {
        console.warn('WebGL 2.0 isn\'t available');
        return null;
    }

    gl.viewport(0, 0, domElement.width, domElement.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const program = buildShaderFromSource(gl, basicVertexShaderSource, basicFragmentShaderSource);

    gl.useProgram(program);


    const renderer = {

        domElement,
        gl,

        setSize(width, height) {
            domElement.width = width;
            domElement.height = height;
            gl.viewport(0, 0, domElement.width, domElement.height);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
        },

        draw(node, viewMatrix) {

            let modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, node.worldMatrix);

            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'modelViewMatrix'), false, modelViewMatrix);

            let mesh = node.mesh;

            for (let i = 0; i < mesh.primitives.length; i++) {

                let primitive = mesh.primitives[i];

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

            }

        },

        render(meshes, cameraNode) {

            gl.clearColor(1.0, 1.0, 1.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.uniformMatrix4fv(gl.getUniformLocation(program, 'projectionMatrix'), false, cameraNode.camera.projectionMatrix);

            const viewMatrix = mat4.invert(mat4.create(), cameraNode.worldMatrix);

            let meshNodes = [];

            function getMesh(node) {
                if (node.mesh) {
                    meshNodes.push(node);
                }
                node.children.map(getMesh);
            }

            scene.nodes.forEach(node => getMesh(node));

            for (let i = 0; i < meshNodes.length; i++) {
                this.draw(meshNodes[i], viewMatrix);
            }

        },

        /**
         *
         *
         * @param {*} n Primitive
         */
        load(primitive, realm) {

            if (primitive.vao) {

                // the primitive has already been loaded.
                return;

            }

            // setup VAO:

            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            if (primitive.indices) {

                let accessor = realm.accessors[primitive.indices];
                let bufferView = realm.bufferViews[accessor.bufferView];

                if (bufferView.element_array_buffer) {

                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferView.element_array_buffer);

                    // the bufferView is already loaded, increment access count.
                    bufferView.bufferAccessCount += 1;

                } else {

                    // create buffer and upload data.

                    let buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

                    let dataView = new DataView(realm.buffers[bufferView.buffer], bufferView.byteOffset, bufferView.byteLength);

                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, dataView, gl.STATIC_DRAW);

                    bufferView.element_array_buffer = buffer;
                    bufferView.bufferAccessCount = 1; // number of accessors linking to this buffer.

                }

            }

            // create and link attribute accessors, and possibly upload bufferView to GPU.

            for (let name in primitive.attributes) {

                let accessor = realm.accessors[primitive.attributes[name]];
                let bufferView = realm.bufferViews[accessor.bufferView];

                console.log(accessor, bufferView);

                if (bufferView.array_buffer) {

                    gl.bindBuffer(gl.ARRAY_BUFFER, bufferView.array_buffer);

                    // the bufferView is already loaded, increment access count.
                    bufferView.bufferAccessCount += 1;

                } else {

                    // create buffer and upload data.

                    let buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

                    let dataView = new DataView(realm.buffers[bufferView.buffer], bufferView.byteOffset, bufferView.byteLength);

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

        /**
         *
         *
         * @param {*} n Mesh
         */
        unload(primitive, realm) {

            if (typeof primitive.vao === 'undefined') {

                // the primitive has already been unloaded.
                return;

            }

            if (primitive.indices) {

                let accessor = primitive.indices;
                let bufferView = accessor.bufferView;

                if (bufferView.element_array_buffer) {

                    if (bufferView.bufferAccessCount > 1) {

                        // the bufferView is still used by another accessor, decrement access count.
                        bufferView.bufferAccessCount -= 1;

                    } else {

                        gl.deleteBuffer(bufferView.element_array_buffer);
                        delete bufferView.element_array_buffer;
                        delete bufferView.bufferAccessCount;

                    }

                }

            }

            for (let name in primitive.attributes) {

                let accessor = primitive.attributes[name];
                let bufferView = accessor.bufferView;

                if (bufferView.array_buffer) {

                    if (bufferView.bufferAccessCount > 1) {

                        // the bufferView is still used by another accessor, decrement access count.
                        bufferView.bufferAccessCount -= 1;

                    } else {

                        gl.deleteBuffer(bufferView.array_buffer);
                        delete bufferView.array_buffer;
                        delete bufferView.bufferAccessCount;

                    }

                }

            }

            gl.deleteVertexArray(primitive.vao);
            delete primitive.vao;

        }
    };

    return renderer;

    // loadTexture(url) {
    //     let image = new Image();

    //     image.src = url;

    //     let texture = this.gl.createTexture();

    //     this.gl.activeTexture(this.gl.TEXTURE0);
    //     this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    //     //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

    //     this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    //     this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    //     this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    //     this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

    //     this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    //     image.addEventListener('load', () => {

    //         this.gl.activeTexture(this.gl.TEXTURE0);
    //         this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    //         this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

    //         this.gl.generateMipmap(this.gl.TEXTURE_2D);
    //         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_LINEAR);
    //         this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    //     });

    //     return texture;
    // }

    // loadCubeMap(urls) {
    //     let ct = 0;
    //     let image = new Array(6);

    //     let cubeMap = this.gl.createTexture();

    //     for (let i = 0; i < 6; i++) {
    //         image[i] = new Image();
    //         image[i].addEventListener('load', () => {
    //             ct++;
    //             if (ct == 6) {
    //                 this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubeMap);
    //                 this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
    //                 var targets = [
    //                     this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    //                     this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    //                     this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    //                 ];
    //                 for (let j = 0; j < 6; j++) {
    //                     this.gl.texImage2D(targets[j], 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image[j]);
    //                     this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    //                     this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    //                     this.gl.texParameterf(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    //                     this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
    //                 }
    //                 this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
    //             }
    //         });
    //         image[i].src = urls[i];
    //     }

    //     return cubeMap;
    // }
};