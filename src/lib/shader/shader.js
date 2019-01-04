import { MAX_NUMBER_OF_LIGHTS } from '../core/constants';

import shaderBuilder from './shaderBuilder.js';

import pbrVertexShaderSource from '../shader/code/pbr-vertex-shader.glsl';
import pbrFragmentShaderSource from '../shader/code/pbr-fragment-shader.glsl';

export default (context, material, enabledAttributes = []) => {

    let defines = '';

    // add the attributes supplied with the primitive.
    for (let name of enabledAttributes) {
        defines += `#define HAS_${name}\n`;
    }

    // always set the maximum number of lights.
    defines += `#define MAX_NUMBER_OF_LIGHTS ${MAX_NUMBER_OF_LIGHTS}\n`;

    if (material.baseColorTexture !== null) {
        defines += '#define HAS_BASECOLORMAP\n';
    }

    if (material.metallicRoughnessTexture !== null) {
        defines += '#define HAS_METALROUGHNESSMAP\n';
    }

    if (material.normalTexture !== null) {
        defines += '#define HAS_NORMALMAP\n';
    }

    if (material.occlusionTexture !== null) {
        defines += '#define HAS_OCCLUSIONMAP\n';
    }

    if (material.emissiveTexture !== null) {
        defines += '#define HAS_EMISSIVEMAP\n';
    }

    const program = shaderBuilder(context, pbrVertexShaderSource.replace('__DEFINES__', defines), pbrFragmentShaderSource.replace('__DEFINES__', defines));

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
            emissiveFactor: context.getUniformLocation(program, 'u_emissive_factor'),

            jointMatrix: context.getUniformLocation(program, 'u_joint_matrix')

        }
    };
};