
import { mat3, mat4, vec3, vec4 } from 'gl-matrix';

import { ATTRIBUTE_LOCATION, TYPE, COMPONENT, MAX_NUMBER_OF_LIGHTS, UBO_BINDING, IS_LITTLE_ENDIAN, LIGHT } from './constants';
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

    const lightsUniformBuffer = gl.createBuffer();
    gl.bindBufferBase(gl.UNIFORM_BUFFER, UBO_BINDING.LIGHTS, lightsUniformBuffer);

    const lightsBuffer = new ArrayBuffer((MAX_NUMBER_OF_LIGHTS * 12) * 8); // allocate buffer holding the lights.
    const lightsBufferView = new DataView(lightsBuffer);

    // instantiate buffer on GPU.
    gl.bufferData(gl.UNIFORM_BUFFER, lightsBuffer, gl.DYNAMIC_DRAW);

    const renderer = {

        domElement,
        gl,

        setSize(width, height) {
            domElement.width = width;
            domElement.height = height;
            gl.viewport(0, 0, domElement.width, domElement.height);
            gl.clearColor(1.0, 1.0, 1.0, 1.0);
        },

        draw(renderable, cameraNode, numberOfLights = 0) {

            const [primitive, worldMatrix] = renderable;

            const material = primitive.material;
            const shader = material.extras.shader;
            gl.useProgram(shader.program);

            // vertex uniforms: (TODO: calculate only per mesh.)
            const viewMatrix = mat4.invert(mat4.create(), cameraNode.worldMatrix);
            const modelViewMatrix = mat4.multiply(mat4.create(), viewMatrix, worldMatrix);
            const modelViewProjectionMatrix = mat4.multiply(mat4.create(), cameraNode.camera.projectionMatrix, modelViewMatrix);
            const normalMatrix = mat3.normalFromMat4(mat3.create(), modelViewMatrix);

            gl.uniformMatrix4fv(shader.uniformLocations.modelMatrix, false, worldMatrix);
            gl.uniformMatrix4fv(shader.uniformLocations.modelViewProjectionMatrix, false, modelViewProjectionMatrix);
            gl.uniformMatrix4fv(shader.uniformLocations.normalMatrix, false, normalMatrix);

            // upload number of lights.
            gl.uniform1i(shader.uniformLocations.numberOfLights, numberOfLights);

            const cameraPosition = mat4.getTranslation(vec3.create(), cameraNode.worldMatrix);
            gl.uniform3fv(shader.uniformLocations.camera, cameraPosition);

            // material uniforms:
            gl.uniform4fv(shader.uniformLocations.baseColorFactor, material.baseColorFactor);
            gl.uniform2f(shader.uniformLocations.metallicRoughnessValues, material.metallicFactor, material.roughnessFactor);

            if (material.baseColorTexture !== null) {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, material.baseColorTexture.texture.extras.gl_texture);
                gl.uniform1i(shader.uniformLocations.baseColorSampler, 0);
            }

            if (material.metallicRoughnessTexture !== null) {
                gl.activeTexture(gl.TEXTURE1);
                gl.bindTexture(gl.TEXTURE_2D, material.metallicRoughnessTexture.texture.extras.gl_texture);
                gl.uniform1i(shader.uniformLocations.metallicRoughnessSampler, 1);
            }

            if (material.normalTexture !== null) {
                gl.activeTexture(gl.TEXTURE2);
                gl.bindTexture(gl.TEXTURE_2D, material.normalTexture.texture.extras.gl_texture);
                gl.uniform1i(shader.uniformLocations.normalSampler, 2);
                gl.uniform1f(shader.uniformLocations.normalScale, material.normalTexture.normalScale);
            }

            if (material.occlusionTexture !== null) {
                gl.activeTexture(gl.TEXTURE3);
                gl.bindTexture(gl.TEXTURE_2D, material.occlusionTexture.texture.extras.gl_texture);
                gl.uniform1i(shader.uniformLocations.occlusionTexture, 3);
                gl.uniform1f(shader.uniformLocations.occlusionStrength, material.occlusionTexture.occlusionStrength);
            }

            if (material.emissiveTexture !== null) {
                gl.activeTexture(gl.TEXTURE4);
                gl.bindTexture(gl.TEXTURE_2D, material.emissiveTexture.texture.extras.gl_texture);
                gl.uniform1i(shader.uniformLocations.emissiveTexture, 4);
                gl.uniform3fv(shader.uniformLocations.emissiveFactor, material.emissiveFactor);
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

        render(renderQueue, cameraNode, lights) {

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // LIGHT PACKING:
            //
            // position: vec4
            // color: vec3
            // intensity: f32
            // type: i32
            // range: f32
            // innerConeAngle: f32
            // outerConeAngle: f32
            //
            // (combine color and intensity to a vec4)
            // VVVV - VVVV - IFFF
            
            // TODO: handle number of lights being larger than the capacity in a more intelligent way?

            for (let i = 0; i < lights.length && i < MAX_NUMBER_OF_LIGHTS; i++) {

                const [light, worldMatrix] = lights[i];

                const position = vec4.create();
                vec4.transformMat4(position, vec4.fromValues(0.0, 0.0, 0.0, 1.0), worldMatrix);

                const offset = i * 12;

                // POSITION:
                lightsBufferView.setFloat32((offset + 0) * 4, position[0], IS_LITTLE_ENDIAN);
                lightsBufferView.setFloat32((offset + 1) * 4, position[1], IS_LITTLE_ENDIAN);
                lightsBufferView.setFloat32((offset + 2) * 4, position[2], IS_LITTLE_ENDIAN);
                lightsBufferView.setFloat32((offset + 3) * 4, position[3], IS_LITTLE_ENDIAN);

                // COLOR + INTENSITY:
                lightsBufferView.setFloat32((offset + 4) * 4, light.color[0], IS_LITTLE_ENDIAN);
                lightsBufferView.setFloat32((offset + 5) * 4, light.color[1], IS_LITTLE_ENDIAN);
                lightsBufferView.setFloat32((offset + 6) * 4, light.color[2], IS_LITTLE_ENDIAN);
                lightsBufferView.setFloat32((offset + 7) * 4, light.intensity, IS_LITTLE_ENDIAN);

                // TYPE + RANGE + INNER + OUTER
                lightsBufferView.setUint32((offset + 8) * 4, light.type, IS_LITTLE_ENDIAN);
                lightsBufferView.setFloat32((offset + 9) * 4, light.range, IS_LITTLE_ENDIAN);
                if (light.type === LIGHT.SPOT) {
                    lightsBufferView.setFloat32((offset + 10) * 4, light.spot.innerConeAngle, IS_LITTLE_ENDIAN);
                    lightsBufferView.setFloat32((offset + 11) * 4, light.spot.outerConeAngle, IS_LITTLE_ENDIAN);
                }

            }

            // update buffer:
            // TODO: only update buffer when lights have changed (use some kind of dirty flag?)
            gl.bufferSubData(gl.UNIFORM_BUFFER, 0, lightsBuffer);

            const numberOfLights = Math.min(lights.length, MAX_NUMBER_OF_LIGHTS);

            for (let i = 0; i < renderQueue.length; i++) {
                this.draw(renderQueue[i], cameraNode, numberOfLights);
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
                material.baseColorTexture.texture.extras.gl_texture = this.loadTexture(material.baseColorTexture.texture);
            }

            if (material.metallicRoughnessTexture !== null) {
                material.metallicRoughnessTexture.texture.extras.gl_texture = this.loadTexture(material.metallicRoughnessTexture.texture);
            }

            if (material.normalTexture !== null) {
                material.normalTexture.texture.extras.gl_texture = this.loadTexture(material.normalTexture.texture);
            }

            if (material.occlusionTexture !== null) {
                material.occlusionTexture.texture.extras.gl_texture = this.loadTexture(material.occlusionTexture.texture);
            }

            if (material.emissiveTexture !== null) {
                material.emissiveTexture.texture.extras.gl_texture = this.loadTexture(material.emissiveTexture.texture);
            }

            // UBO:
            gl.uniformBlockBinding(shader.program, gl.getUniformBlockIndex(shader.program, 'LightBlock'), UBO_BINDING.LIGHT);

        },

        loadTexture(texture) {

            const { sampler, source } = texture;

            const gl_texture = gl.createTexture();

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gl_texture);

            gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
            gl.generateMipmap(gl.TEXTURE_2D);

            return gl_texture;

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