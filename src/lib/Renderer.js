
import { mat4, vec4 } from 'gl-matrix';

import BasicShader from './BasicShader';

import GeometryBuffer from './GeometryBuffer';
import Drawable from './Drawable';

export default class Renderer {
    constructor(width, height) {
        this.domElement = document.createElement('canvas');
        this.domElement.width = width;
        this.domElement.height = height;

        this.gl = this.domElement.getContext('webgl2');

        if (!this.gl) {
            alert('WebGL 2.0 isn\'t available');
        }

        this.gl.viewport(0, 0, this.domElement.width, this.domElement.height);
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);

        this.drawables = []; // one per mesh.
        this.shaders = []; // shared instances of shaders.
        this.buffers = []; // shared instances of buffers.

        this.numberOfLights = 0; // number of lights at previous rendering. Used to recompile shaders if more lights are added.
    }

    setSize(width, height) {
        this.domElement.width = width;
        this.domElement.height = height;
        this.gl.viewport(0, 0, this.domElement.width, this.domElement.height);
        this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    }

    _initDrawable(mesh, properties) {
        // Setup program
        // Try to find an instance of the shader that has already been constructed.
        let shader = this.shaders.find((s) => {
            if (s instanceof mesh.material.Shader) {
                return s;
            }
        });

        if (shader === undefined) {
            if (mesh.material.Shader === undefined) {
                throw Error('WarpGL: Material is not linked to a Shader-class. : ' + mesh.material);
            }

            shader = new mesh.material.Shader(this.gl, properties);
            this.shaders.push(shader); // add to list of shaders.
        }

        // Setup buffer
        // check if there already exists a buffer of the same type.
        let buffer = this.buffers.find((b) => {
            if (b.type === mesh.geometry.type) {
                return b;
            }
        });

        // Create new buffer if it does not exist.
        if (buffer === undefined) {
            buffer = new GeometryBuffer(this.gl, mesh.geometry);
            this.buffers.push(buffer);
        }

        // Setup drawable
        let drawable = new Drawable(mesh.uuid, buffer, shader);
        mesh.drawable = drawable;

        this.drawables.push(drawable); // add to drawables.

        return drawable;
    }

    _draw(mesh, drawable, camera, lights) {
        // this is where the magic happens, baby.


        //let material = mesh.material; // contains all uniforms.
        let shader = drawable.shader;
        let geometryBuffer = drawable.geometryBuffer;

        // TODO: use one mat4 for each draw.
        let modelViewMatrix = mat4.multiply(mat4.create(), camera.viewMatrix, mesh.worldMatrix);

        // Activate program
        this.gl.useProgram(shader.program);

        // Bind buffer:
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, geometryBuffer.buffer);

        // bind vPosition attribute.
        this.gl.vertexAttribPointer(shader.attributeLocations.vPosition, 4, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(shader.attributeLocations.vPosition);

        if (shader.attributeLocations.vNormal > -1) {
            this.gl.vertexAttribPointer(shader.attributeLocations.vNormal, 3, this.gl.FLOAT, false, 0, geometryBuffer.bufferNormalsOffset);
            this.gl.enableVertexAttribArray(shader.attributeLocations.vNormal);
        }

        if (shader.attributeLocations.vTextureCoordinate > -1) {
            this.gl.vertexAttribPointer(shader.attributeLocations.vTextureCoordinate, 2, this.gl.FLOAT, false, 0, geometryBuffer.bufferUvsOffset);
            this.gl.enableVertexAttribArray(shader.attributeLocations.vTextureCoordinate);
        }

        if (shader.attributeLocations.vTangent > -1) {
            this.gl.vertexAttribPointer(shader.attributeLocations.vTangent, 3, this.gl.FLOAT, false, 0, geometryBuffer.bufferTangentsOffset);
            this.gl.enableVertexAttribArray(shader.attributeLocations.vTangent);
        }

        // Upload modelViewMatrix:
        this.gl.uniformMatrix4fv(shader.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // TODO: Generalize pipline.
        if (shader instanceof BasicShader) {
            this.gl.uniform4fv(shader.uniformLocations.color, mesh.material.uniforms.color);

            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, mesh.material.uniforms.map);
            this.gl.uniform1i(shader.uniformLocations.map, 0);

        }

        //  else if (shader instanceof PhongShader) {
        //     //let nm = transpose(inverse3(modelViewMatrix));
        //     let nm = normalMatrix(modelViewMatrix);
        //     this.gl.uniformMatrix3fv(shader.uniformLocations.normalMatrix, false, flatten(nm));

        //     if (mesh.material.uniforms.hasMap) {
        //         this.gl.activeTexture(this.gl.TEXTURE0);
        //         this.gl.bindTexture(this.gl.TEXTURE_2D, mesh.material.uniforms.map);
        //         this.gl.uniform1i(shader.uniformLocations.map, 0);
        //     }

        //     this.gl.uniform1i(shader.uniformLocations.hasMap, mesh.material.uniforms.hasMap);

        //     // normal map
        //     if (mesh.material.uniforms.hasNormalMap) {
        //         this.gl.activeTexture(this.gl.TEXTURE1);
        //         this.gl.bindTexture(this.gl.TEXTURE_2D, mesh.material.uniforms.normalMap);
        //         this.gl.uniform1i(shader.uniformLocations.normalMap, 1);
        //     }

        //     this.gl.uniform1i(shader.uniformLocations.hasNormalMap, mesh.material.uniforms.hasNormalMap);

        //     // upload lights
        //     if (lights.position.length > 0) {
        //         this.gl.uniform4fv(shader.uniformLocations.lightPosition, flatten(lights.position));
        //         this.gl.uniform4fv(shader.uniformLocations.lightDiffuse, flatten(lights.diffuse));
        //         this.gl.uniform4fv(shader.uniformLocations.lightSpecular, flatten(lights.specular));
        //         this.gl.uniform4fv(shader.uniformLocations.lightAmbient, flatten(vec4(1, 1, 1, 1)));
        //     }

        //     // Set materials
        //     this.gl.uniform4fv(shader.uniformLocations.color, flatten(mesh.material.uniforms.color));
        //     this.gl.uniform4fv(shader.uniformLocations.ambient, flatten(mesh.material.uniforms.ambient));
        //     this.gl.uniform4fv(shader.uniformLocations.specular, flatten(mesh.material.uniforms.specular));
        //     this.gl.uniform1f(shader.uniformLocations.shininess, mesh.material.uniforms.shininess);

        // } else if (shader instanceof CubeMapShader) {
        //     this.gl.activeTexture(this.gl.TEXTURE0);
        //     this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, mesh.material.uniforms.map);
        //     this.gl.uniform1i(shader.uniformLocations.map, 0);

        // } 

        else {
            throw Error('WarpGL: Unknown shader type. : ' + shader);
        }


        if (geometryBuffer.indexed) {
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, geometryBuffer.elementArrayBuffer);
            this.gl.drawElements(this.gl.TRIANGLES, geometryBuffer.numberOfElements, geometryBuffer.indexType, 0);
        } else {
            this.gl.drawArrays(this.gl.TRIANGLES, 0, geometryBuffer.numberOfVertices);
        }

        this.gl.disableVertexAttribArray(shader.attributeLocations.vPosition);

        if (shader.attributeLocations.vNormal > -1) {
            this.gl.disableVertexAttribArray(shader.attributeLocations.vNormal);
        }

        if (shader.attributeLocations.vTextureCoordinate > -1) {
            this.gl.disableVertexAttribArray(shader.attributeLocations.vTextureCoordinate);
        }

        if (shader.attributeLocations.vTangent > -1) {
            this.gl.disableVertexAttribArray(shader.attributeLocations.vTangent);
        }
    }

    render(scene, camera) {
        this.gl.clearColor(...scene.background);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // TODO: replace with UBO.
        this.shaders.forEach((shader) => {
            this.gl.useProgram(shader.program);
            this.gl.uniformMatrix4fv(shader.uniformLocations.projectionMatrix, false, camera.projectionMatrix);
        });

        this.gl.useProgram(null);

        let entities = scene.getEntities();

        let forceInitialize = false;
        if (entities.lights.length !== this.numberOfLights) { // if number of lights in scene has changed we need to reinitalize the shaders.
            forceInitialize = true;
            this.numberOfLights = entities.lights.length;
        }

        let initProperties = {
            numberOfLights: this.numberOfLights,
        };

        // setup lights.
        let lights = {
            position: [],
            diffuse: [],
            specular: []
        };

        entities.lights.forEach((light) => {
            let lightPosition = vec4.transformMat4(vec4.create(), vec4.create(), (mat4.multiply(mat4.create(), camera.viewMatrix, light.worldMatrix)));
            lights.position.push(lightPosition);
            lights.diffuse.push(light.diffuse);
            lights.specular.push(light.specular);
        });

        entities.meshes.forEach((mesh) => {
            // check if there exists a drawable for the mesh.
            let drawable;
            if (forceInitialize === false) {
                if (mesh.drawable instanceof Drawable && mesh.uuid === mesh.drawable.uuid) {
                    // we need to check if the uuid is correct too, incase the mesh is being rendered in two different renderers.
                    drawable = mesh.drawable;
                } else {
                    drawable = this.drawables.find(drawable => drawable.uuid === mesh.uuid);
                }
            }

            if (drawable === undefined) {
                drawable = this._initDrawable(mesh, initProperties); // create drawable before rendering.
            }

            this._draw(mesh, drawable, camera, lights); // use drawable to render the mesh.
        });
    }

    loadTexture(url) {
        let image = new Image();

        image.src = url;

        let texture = this.gl.createTexture();

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

        image.addEventListener('load', () => {
            this.gl.activeTexture(this.gl.TEXTURE0);
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST_MIPMAP_LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        });

        return texture;
    }

    loadCubeMap(urls) {
        let ct = 0;
        let image = new Array(6);

        let cubeMap = this.gl.createTexture();

        for (let i = 0; i < 6; i++) {
            image[i] = new Image();
            image[i].addEventListener('load', () => {
                ct++;
                if (ct == 6) {
                    this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, cubeMap);
                    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
                    var targets = [
                        this.gl.TEXTURE_CUBE_MAP_POSITIVE_X, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
                        this.gl.TEXTURE_CUBE_MAP_POSITIVE_Y, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                        this.gl.TEXTURE_CUBE_MAP_POSITIVE_Z, this.gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
                    ];
                    for (let j = 0; j < 6; j++) {
                        this.gl.texImage2D(targets[j], 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image[j]);
                        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                        this.gl.texParameterf(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
                    }
                    this.gl.generateMipmap(this.gl.TEXTURE_CUBE_MAP);
                }
            });
            image[i].src = urls[i];
        }

        return cubeMap;
    }
}