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
            
            modelViewProjectionMatrix: context.getUniformLocation(program, 'u_model_view_projection_matrix'),
            modelViewMatrix: context.getUniformLocation(program, 'u_model_view_matrix'),
            normalMatrix: context.getUniformLocation(program, 'u_normal_matrix'),

            numberOfLights: context.getUniformLocation(program, 'u_number_of_lights'),

            baseColorFactor: context.getUniformLocation(program, 'u_base_color_factor'),
            metallicRoughnessValues: context.getUniformLocation(program, 'u_metallic_roughness_values'),

            baseColorSampler: context.getUniformLocation(program, 'u_base_color_sampler'),
            metallicRoughnessSampler: context.getUniformLocation(program, 'u_metallic_roughness_sampler'),
            
            normalSampler: context.getUniformLocation(program, 'u_normal_sampler'),
            normalScale: context.getUniformLocation(program, 'u_normal_scale'),

            occlusionSampler: context.getUniformLocation(program, 'u_occlusion_sampler'),
            occlusionStrength: context.getUniformLocation(program, 'u_occlusion_strength'),

            emissiveSampler: context.getUniformLocation(program, 'u_emissive_sampler'),
            emissiveFactor: context.getUniformLocation(program, 'u_emissive_factor')

        }
    };
};