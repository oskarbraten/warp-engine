
import { mat3, mat4 } from 'gl-matrix';

import { ATTRIBUTE_LOCATION, TYPE, COMPONENT } from './constants';
import standardShader from '../shader/standard';

export default (context = null) => {

    if (context === null) {
        throw Error('You must pass a WebGL2 context to the renderer.');
    }

    const gl = context;
    const domElement = gl.canvas;

    gl.viewport(0, 0, domElement.width, domElement.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const renderer = {

        domElement,
        gl,

        setSize(width, height) {
            domElement.width = width;
            domElement.height = height;
            gl.viewport(0, 0, domElement.width, domElement.height);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
        },

        draw(renderable, viewMatrix, projectionMatrix) {

            const [primitive, worldMatrix] = renderable;

            const material = primitive.material;
            const shader = material.extras.shader;
            gl.useProgram(shader.program);

            // vertex uniforms: (TODO: calculate only per mesh.)
            const modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, worldMatrix);
            const modelViewProjectionMatrix = mat4.multiply(mat4.create(), projectionMatrix, modelViewMatrix);
            const normalMatrix = mat3.normalFromMat4(mat3.create(), modelViewMatrix);

            gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, worldMatrix);
            gl.uniformMatrix4fv(shader.uniformLocations.modelViewProjectionMatrix, false, modelViewProjectionMatrix);
            gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix);

            // material uniforms:

            gl.uniform4fv(shader.uniformLocations.baseColorFactor, material.baseColorFactor);

            if (primitive.material.baseColorTexture !== null) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, primitive.material.baseColorTexture.texture.extras.gl_texture);
                gl.uniform1i(shader.uniformLocations.baseColorSampler, 0);
            }

            if (primitive.extras.vao) {

                gl.bindVertexArray(primitive.extras.vao);

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

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            const viewMatrix = mat4.invert(mat4.create(), cameraNode.worldMatrix);

            for (let i = 0; i < renderQueue.length; i++) {
                this.draw(renderQueue[i], viewMatrix, cameraNode.camera.projectionMatrix);
            }

        },

        /**
         *
         *
         * @param {*} n Scene, node, or mesh.
         */
        load(primitive) {

            if (primitive.extras.vao) {

                // the primitive has already been loaded.
                return;

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


            const material = primitive.material;

            if (material.extras.shader) {
                return; // shaderprogram already compiled.
            }

            const shader = standardShader(gl, material);
            material.extras.shader = shader;

            if (material.baseColorTexture !== null) {

                const sampler = material.baseColorTexture.texture.sampler;

                const texture = gl.createTexture();

                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);

                gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);

                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, material.baseColorTexture.texture.source);
                gl.generateMipmap(gl.TEXTURE_2D);

                material.baseColorTexture.texture.extras.gl_texture = texture;

            }

        },

        /**
         *
         *
         * @param {*} n Scene, node, or mesh.
         */
        unload(primitive) {

            if (typeof primitive.extras.vao === 'undefined') {

                // the primitive has already been unloaded.
                return;

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

    };

    return renderer;

    // loadTexture(url) {
    //     let image = new Image();

    //     image.src = url;

    //     let texture = this.gl.createTexture();

    //     this.gl.activeTexture(this.gl.TEXTURE0);
    //     this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    //     this.gl.pixelStorei(this.gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this.gl.NONE);

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