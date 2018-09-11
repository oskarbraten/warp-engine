
import { mat4 } from 'gl-matrix';

import { ATTRIBUTE_LOCATION, TYPE, COMPONENT } from './constants';

import buildShaderFromSource from '../shading/shader';

import basicVertexShaderSource from '../shading/shaders/basic-vertex-shader.glsl';
import basicFragmentShaderSource from '../shading/shaders/basic-fragment-shader.glsl';


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

                if (primitive.extras.vao) {

                    gl.bindVertexArray(primitive.extras.vao);

                    if (primitive.indices) {

                        const offset = primitive.indices.byteOffset / COMPONENT.SIZE[primitive.indices.componentType];
                        gl.drawElements(primitive.mode, primitive.indices.count, primitive.indices.componentType, offset);

                    }

                } else {

                    throw Error('Attempted to draw primitive with no VAO (Is the mesh loaded?).');

                }

            }

        },

        render(scene, cameraNode) {

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
         * @param {*} n Scene, node, or mesh.
         */
        load(n) {

            if (n.primitives) {

                for (let i = 0; i < n.primitives.length; i++) {

                    let primitive = n.primitives[i];

                    if (primitive.extras.vao) {

                        // the primitive has already been loaded.
                        continue;

                    }

                    // setup VAO:

                    let vao = gl.createVertexArray();
                    gl.bindVertexArray(vao);

                    if (primitive.indices) {

                        let accessor = primitive.indices;
                        let bufferView = accessor.bufferView;

                        if (bufferView.extras.element_array_buffer) {

                            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferView.extras.element_array_buffer);

                            // the bufferView is already loaded, increment access count.
                            bufferView.extras.bufferAccessCount += 1;

                        } else {

                            // create buffer and upload data.

                            let buffer = gl.createBuffer();
                            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

                            let dataView = new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

                            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, dataView, gl.STATIC_DRAW);

                            bufferView.extras.element_array_buffer = buffer;
                            bufferView.extras.bufferAccessCount = 1; // number of accessors linking to this buffer.

                        }

                    }

                    // create and link attribute accessors, and possibly upload bufferView to GPU.

                    for (let name in primitive.attributes) {

                        let accessor = primitive.attributes[name];
                        let bufferView = accessor.bufferView;

                        if (bufferView.extras.array_buffer) {

                            gl.bindBuffer(gl.ARRAY_BUFFER, bufferView.extras.array_buffer);

                            // the bufferView is already loaded, increment access count.
                            bufferView.extras.bufferAccessCount += 1;

                        } else {

                            // create buffer and upload data.

                            let buffer = gl.createBuffer();
                            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

                            let dataView = new DataView(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);

                            gl.bufferData(gl.ARRAY_BUFFER, dataView, gl.STATIC_DRAW);

                            // setup and enable vertex attributes (Using the predefined and constant locations.)
                            gl.vertexAttribPointer(ATTRIBUTE_LOCATION[name], TYPE[accessor.type], accessor.componentType, accessor.normalized, bufferView.byteStride, accessor.byteOffset);
                            gl.enableVertexAttribArray(ATTRIBUTE_LOCATION[name]);

                            bufferView.extras.array_buffer = buffer;
                            bufferView.extras.bufferAccessCount = 1; // number of accessors linking to this buffer.

                        }
                    }

                    primitive.extras.vao = vao;

                }

            } else if (n.mesh) {

                this.load(n.mesh);

            } else if (n.children) {

                n.children.forEach(this.load.bind(this));

            } else if (n.nodes) {

                n.nodes.forEach(this.load.bind(this));

            }
        },

        /**
         *
         *
         * @param {*} n Scene, node, or mesh.
         */
        unload(n) {

            if (n.primitives) {
                console.log(n);

                for (let i = 0; i < n.primitives.length; i++) {

                    let primitive = n.primitives[i];

                    if (typeof primitive.extras.vao === 'undefined') {

                        // the primitive has already been unloaded.
                        continue;

                    }

                    if (primitive.indices) {

                        let accessor = primitive.indices;
                        let bufferView = accessor.bufferView;

                        if (bufferView.extras.element_array_buffer) {

                            if (bufferView.extras.bufferAccessCount > 1) {

                                // the bufferView is still used by another accessor, decrement access count.
                                bufferView.extras.bufferAccessCount -= 1;

                            } else {

                                gl.deleteBuffer(bufferView.extras.element_array_buffer);
                                delete bufferView.extras.element_array_buffer;
                                delete bufferView.extras.bufferAccessCount;

                            }

                        }

                    }

                    for (let name in primitive.attributes) {

                        let accessor = primitive.attributes[name];
                        let bufferView = accessor.bufferView;

                        if (bufferView.extras.array_buffer) {

                            if (bufferView.extras.bufferAccessCount > 1) {

                                // the bufferView is still used by another accessor, decrement access count.
                                bufferView.extras.bufferAccessCount -= 1;

                            } else {

                                gl.deleteBuffer(bufferView.extras.array_buffer);
                                delete bufferView.extras.array_buffer;
                                delete bufferView.extras.bufferAccessCount;

                            }

                        }

                    }

                    gl.deleteVertexArray(primitive.extras.vao);
                    delete primitive.extras.vao;

                }

            } else if (n.mesh) {

                this.unload(n.mesh);

            } else if (n.children) {

                n.children.forEach(this.unload.bind(this));

            } else if (n.nodes) {

                n.nodes.forEach(this.unload.bind(this));

            }
        }

    };

    return renderer;


    // _draw(mesh, drawable, camera, lights) {
    //     // this is where the magic happens, baby.


    //     //let material = mesh.material; // contains all uniforms.
    //     let shader = drawable.shader;
    //     let geometryBuffer = drawable.geometryBuffer;

    //     // TODO: use one mat4 for each draw.
    //     let modelViewMatrix = mat4.multiply(mat4.create(), camera.viewMatrix, mesh.worldMatrix);

    //     // Activate program
    //     this.gl.useProgram(shader.program);

    //     // Bind buffer:
    //     this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometryBuffer.buffer);

    //     // bind vPosition attribute.
    //     this.gl.vertexAttribPointer(POSITION_LOCATION, 4, this.gl.FLOAT, false, 0, 0);
    //     this.gl.enableVertexAttribArray(POSITION_LOCATION);

    //     if (shader.attributeLocations.vNormal > -1) {
    //         this.gl.vertexAttribPointer(shader.attributeLocations.vNormal, 3, this.gl.FLOAT, false, 0, geometryBuffer.bufferNormalsOffset);
    //         this.gl.enableVertexAttribArray(shader.attributeLocations.vNormal);
    //     }

    //     if (shader.attributeLocations.vTextureCoordinate > -1) {
    //         this.gl.vertexAttribPointer(UV_LOCATION, 2, this.gl.FLOAT, false, 0, geometryBuffer.bufferUvsOffset);
    //         this.gl.enableVertexAttribArray(UV_LOCATION);
    //     }

    //     if (shader.attributeLocations.vTangent > -1) {
    //         this.gl.vertexAttribPointer(shader.attributeLocations.vTangent, 3, this.gl.FLOAT, false, 0, geometryBuffer.bufferTangentsOffset);
    //         this.gl.enableVertexAttribArray(shader.attributeLocations.vTangent);
    //     }

    //     // Upload modelViewMatrix:
    //     this.gl.uniformMatrix4fv(shader.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    //     // TODO: Generalize pipline.
    //     if (shader instanceof BasicShader) {
    //         this.gl.uniform4fv(shader.uniformLocations.color, mesh.material.uniforms.color);


    //         this.gl.uniform1i(shader.uniformLocations.hasMap, mesh.material.uniforms.hasMap);

    //         if (mesh.material.uniforms.hasMap) {
    //             this.gl.activeTexture(this.gl.TEXTURE0);
    //             this.gl.bindTexture(this.gl.TEXTURE_2D, mesh.material.uniforms.map);
    //             this.gl.uniform1i(shader.uniformLocations.map, 0);
    //         }
    //     } else {
    //         throw Error('WarpGL: Unknown shader type. : ' + shader);
    //     }


    //     if (geometryBuffer.indexed) {
    //         this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometryBuffer.elementArrayBuffer);
    //         this.gl.drawElements(this.gl.TRIANGLES, geometryBuffer.numberOfElements, geometryBuffer.indexType, 0);
    //     } else {
    //         this.gl.drawArrays(this.gl.TRIANGLES, 0, geometryBuffer.numberOfVertices);
    //     }

    //     this.gl.disableVertexAttribArray(shader.attributeLocations.vPosition);

    //     if (shader.attributeLocations.vNormal > -1) {
    //         this.gl.disableVertexAttribArray(shader.attributeLocations.vNormal);
    //     }

    //     if (shader.attributeLocations.vTextureCoordinate > -1) {
    //         this.gl.disableVertexAttribArray(shader.attributeLocations.vTextureCoordinate);
    //     }

    //     if (shader.attributeLocations.vTangent > -1) {
    //         this.gl.disableVertexAttribArray(shader.attributeLocations.vTangent);
    //     }
    // }



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