import { MAX_NUMBER_OF_LIGHTS } from '../core/constants';

import shaderBuilder from './shaderBuilder.js';

import pbrVertexShaderSource from '../shader/code/pbr-vertex-shader.glsl';
import pbrFragmentShaderSource from '../shader/code/pbr-fragment-shader.glsl';

export default (context, material) => {

    let fragmentDefines = '';

    // always set the maximum number of lights.
    fragmentDefines += `#define MAX_NUMBER_OF_LIGHTS ${MAX_NUMBER_OF_LIGHTS}\n`;

    if (material.baseColorTexture !== null) {
        fragmentDefines += '#define HAS_BASECOLORMAP\n';
    }

    if (material.metallicRoughnessTexture !== null) {
        fragmentDefines += '#define HAS_METALROUGHNESSMAP\n';
    }

    if (material.normalTexture !== null) {
        fragmentDefines += '#define HAS_NORMALMAP\n';
    }

    if (material.occlusionTexture !== null) {
        fragmentDefines += '#define HAS_OCCLUSIONMAP\n';
    }

    if (material.emissiveTexture !== null) {
        fragmentDefines += '#define HAS_EMISSIVEMAP\n';
    }

    const program = shaderBuilder(context, pbrVertexShaderSource.replace('__DEFINES__', ''), pbrFragmentShaderSource.replace('__DEFINES__', fragmentDefines));

    context.useProgram(program);

    return {
        program,
        uniformLocations: {
            
            modelViewProjectionMatrix: context.getUniformLocation(program, 'modelViewProjectionMatrix'),
            modelViewMatrix: context.getUniformLocation(program, 'modelViewMatrix'),
            normalMatrix: context.getUniformLocation(program, 'normalMatrix'),

            numberOfLights: context.getUniformLocation(program, 'u_NumberOfLights'),

            camera: context.getUniformLocation(program, 'u_Camera'),

            baseColorSampler: context.getUniformLocation(program, 'u_BaseColorSampler'),
            baseColorFactor: context.getUniformLocation(program, 'u_BaseColorFactor'),

            normalSampler: context.getUniformLocation(program, 'u_NormalSampler'),
            normalScale: context.getUniformLocation(program, 'u_NormalScale'),

            emissiveSampler: context.getUniformLocation(program, 'u_EmissiveSampler'),
            emissiveFactor: context.getUniformLocation(program, 'u_EmissiveFactor'),

            metallicRoughnessSampler: context.getUniformLocation(program, 'u_MetallicRoughnessSampler'),
            metallicRoughnessValues: context.getUniformLocation(program, 'u_MetallicRoughnessValues'),
            
            occlusionSampler: context.getUniformLocation(program, 'u_OcclusionSampler'),
            occlusionStrength: context.getUniformLocation(program, 'u_OcclusionStrength')

        }
    };
};