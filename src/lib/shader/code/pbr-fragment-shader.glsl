#version 300 es

__DEFINES__

#define MANUAL_SRGB // TODO: investigate use of gamma correction.

precision highp float;

const float PI = 3.141592653589793;
const float MIN_ROUGHNESS = 0.04;

const uint LIGHT_DIRECTIONAL = 0U;
const uint LIGHT_POINT = 1U;
const uint LIGHT_SPOT = 2U;

struct Light {
    uint type;
    float range;
    float angle_scale;
    float angle_offset;
    vec4 color; // intensity in the alpha-component.
    vec3 position;
    vec3 forward;
};

layout(std140) uniform LightBlock {
    Light lights[MAX_NUMBER_OF_LIGHTS];
};

uniform int u_number_of_lights;

#ifdef USE_IBL
    uniform samplerCube u_diffuse_env_sampler;
    uniform samplerCube u_specular_env_sampler;
    uniform sampler2D u_brdfLUT;
#endif

uniform vec4 u_base_color_factor;
uniform vec2 u_metallic_roughness_values;

#ifdef HAS_BASECOLORMAP
    uniform sampler2D u_base_color_sampler;
#endif

#ifdef HAS_METALROUGHNESSMAP
    uniform sampler2D u_metallic_roughness_sampler;
#endif

#ifdef HAS_NORMALMAP
    uniform sampler2D u_normal_sampler;
    uniform float u_normal_scale;
#endif

#ifdef HAS_OCCLUSIONMAP
    uniform sampler2D u_occlusion_sampler;
    uniform float u_occlusion_strength;
#endif

#ifdef HAS_EMISSIVEMAP
    uniform sampler2D u_emissive_sampler;
    uniform vec3 u_emissive_factor;
#endif


in vec3 position;
in vec2 texcoord_0;
in mat3 TBN;

out vec4 out_color;

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
    float NdotL;                  // cos angle between normal and light direction
    float NdotV;                  // cos angle between normal and view direction
    float NdotH;                  // cos angle between normal and half vector
    float LdotH;                  // cos angle between light direction and half vector
    float VdotH;                  // cos angle between view direction and half vector
    float perceptual_roughness;    // roughness value, as authored by the model creator (input to shader)
    float metalness;              // metallic value at the surface
    vec3 reflectance_0;            // full reflectance color (normal incidence angle)
    vec3 reflectance_90;           // reflectance color at grazing angle
    float alpha_roughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuse_color;            // color contribution from diffuse lighting
    vec3 specular_color;           // color contribution from specular lighting
};

vec4 srgb_to_linear(vec4 srgb_in) {

    #ifdef MANUAL_SRGB
    #ifdef SRGB_FAST_APPROXIMATION
    vec3 linear_out = pow(srgb_in.xyz, vec3(2.2));
    #else //SRGB_FAST_APPROXIMATION
    vec3 bLess = step(vec3(0.04045), srgb_in.xyz);
    vec3 linear_out = mix(srgb_in.xyz / vec3(12.92), pow((srgb_in.xyz + vec3(0.055)) / vec3(1.055), vec3(2.4)), bLess);
    #endif //SRGB_FAST_APPROXIMATION
    return vec4(linear_out, srgb_in.w);
    #else //MANUAL_SRGB
    return srgb_in;
    #endif //MANUAL_SRGB

}

vec3 getNormal() {

    mat3 tbn = TBN;

    #ifdef HAS_NORMALMAP
    vec3 n = texture(u_normal_sampler, texcoord_0).rgb;
    n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_normal_scale, u_normal_scale, 1.0)));
    #else
    // The TBN matrix has been linearly interpolated, so we need to re-normalize it.
    vec3 n = normalize(tbn[2].xyz);
    #endif

    return n;

}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
vec3 get_ibl_contribution(PBRInfo inputs, vec3 n, vec3 reflection) {
    float mipCount = 9.0; // resolution of 512x512
    float lod = (inputs.perceptual_roughness * mipCount);
    // retrieve a scale and bias to F0. See [1], Figure 3
    vec3 brdf = srgb_to_linear(texture(u_brdfLUT, vec2(inputs.NdotV, 1.0 - inputs.perceptual_roughness))).rgb;
    vec3 diffuseLight = srgb_to_linear(textureCube(u_diffuse_env_sampler, n)).rgb;

#ifdef USE_TEX_LOD
    vec3 specularLight = srgb_to_linear(textureCubeLodEXT(u_specular_env_sampler, reflection, lod)).rgb;
#else
    vec3 specularLight = srgb_to_linear(textureCube(u_specular_env_sampler, reflection)).rgb;
#endif

    vec3 diffuse = diffuseLight * inputs.diffuse_color;
    vec3 specular = specularLight * (inputs.specular_color * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms
    diffuse *= u_ScaleIBLAmbient.x;
    specular *= u_ScaleIBLAmbient.y;

    return diffuse + specular;
}
#endif

/* Punctual light attenuation
 * From Frostbite PBR Course:
 * http://www.frostbite.com/wp-content/uploads/2014/11/course_notes_moving_frostbite_to_pbr.pdf */

float smooth_attenuation(float distance_squared, float range_inverse_squared) {
    float factor = distance_squared * range_inverse_squared;
    float smooth_factor = clamp(1.0 - (distance_squared * range_inverse_squared), 0.0, 1.0);
    return smooth_factor * smooth_factor;
}

float distance_attenuation(float distance_squared, float range_inverse_squared) {
    return smooth_attenuation(distance_squared, range_inverse_squared) / max(distance_squared, 0.01);
}

// For spotlight:
float angular_attenuation(vec3 L, vec3 forward, float angle_scale, float angle_offset) {
    float cd = dot(forward, L);
    float attenuation = clamp(cd * angle_scale + angle_offset, 0.0, 1.0);
    attenuation *= attenuation;

    return attenuation;
}

/* Basic Lambertian diffuse
 * Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
 * See also [1], Equation 1 */
vec3 diffuse(PBRInfo inputs) {
    return inputs.diffuse_color / PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specular_reflection(PBRInfo inputs) {
    return inputs.reflectance_0 + (inputs.reflectance_90 - inputs.reflectance_0) * pow(clamp(1.0 - inputs.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alpha_roughness as input as originally proposed in [2].
float geometric_occlusion(PBRInfo inputs) {
    float NdotL = inputs.NdotL;
    float NdotV = inputs.NdotV;
    float r = inputs.alpha_roughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float microfacet_distribution(PBRInfo inputs) {
    float roughness_sq = inputs.alpha_roughness * inputs.alpha_roughness;
    float f = (inputs.NdotH * roughness_sq - inputs.NdotH) * inputs.NdotH + 1.0;
    return roughness_sq / (PI * f * f);
}


void main() {
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptual_roughness = u_metallic_roughness_values.y;
    float metallic = u_metallic_roughness_values.x;

    #ifdef HAS_METALROUGHNESSMAP
        // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
        // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
        vec4 mrSample = texture(u_metallic_roughness_sampler, texcoord_0);
        perceptual_roughness = mrSample.g * perceptual_roughness;
        metallic = mrSample.b * metallic;
    #endif

    perceptual_roughness = clamp(perceptual_roughness, MIN_ROUGHNESS, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alpha_roughness = perceptual_roughness * perceptual_roughness;

    // The albedo may be defined from a base texture or a flat color
    #ifdef HAS_BASECOLORMAP
        vec4 base_color = srgb_to_linear(texture(u_base_color_sampler, texcoord_0)) * u_base_color_factor;
    #else
        vec4 base_color = u_base_color_factor;
    #endif

    vec3 f0 = vec3(0.04);
    vec3 diffuse_color = base_color.rgb * (vec3(1.0) - f0);
    diffuse_color *= 1.0 - metallic;
    vec3 specular_color = mix(f0, base_color.rgb, metallic);

    // Compute reflectance.
    float reflectance = max(max(specular_color.r, specular_color.g), specular_color.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance_90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specular_environment_r0 = specular_color.rgb;
    vec3 specular_environment_r90 = vec3(1.0, 1.0, 1.0) * reflectance_90;

    vec3 n = getNormal();           // normal at surface point
    vec3 v = normalize(-position);  // Vector from surface point to camera, (camera is at the origin in eye-space)
    vec3 reflection = -normalize(reflect(v, n));

    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);

    PBRInfo pbr_inputs = PBRInfo(
        0.0, // filled in later for each light.
        NdotV,
        0.0, // filled in later for each light.
        0.0, // filled in later for each light.
        0.0, // filled in later for each light.
        perceptual_roughness,
        metallic,
        specular_environment_r0,
        specular_environment_r90,
        alpha_roughness,
        diffuse_color,
        specular_color
    );
    
    vec3 color = vec3(0.0, 0.0, 0.0);

    for (int i = 0; i < MAX_NUMBER_OF_LIGHTS; i++) {
        if (i >= u_number_of_lights) break; // TODO: check if this is faster than a dynamic loop.

        vec3 light_direction;
        vec3 light_color = lights[i].color.rgb;
        float light_intensity = lights[i].color.a;

        float attenuation = 1.0;

        if (lights[i].type >= LIGHT_POINT) { // >= for both point and spot lights.

            light_direction = lights[i].position - position; // Vector from surface point to light.

            // Compute attenuation:
            float distance_squared = dot(light_direction, light_direction);
            float range_inverse_squared = 1.0 / (lights[i].range * lights[i].range); // TODO: precalculate?

            if (lights[i].range > 0.0) {
                attenuation = light_intensity * distance_attenuation(distance_squared, range_inverse_squared);
            } else {
                attenuation = light_intensity / max(distance_squared, 0.01);
            }

        } else {
            // Directional lights emit light in the direction of the local -z axis.
            light_direction = lights[i].forward;
            attenuation = light_intensity; // TODO: check if this is physically correct.
        }

        vec3 l = normalize(light_direction);   // Vector from surface point to light (normalized)

        if (lights[i].type == LIGHT_SPOT) {
            attenuation *= angular_attenuation(l, lights[i].forward, lights[i].angle_scale, lights[i].angle_offset);
        }

        vec3 h = normalize(l + v);              // Half vector between both l and v
        
        float NdotL = clamp(dot(n, l), 0.001, 1.0);
        float NdotH = clamp(dot(n, h), 0.0, 1.0);
        float LdotH = clamp(dot(l, h), 0.0, 1.0);
        float VdotH = clamp(dot(v, h), 0.0, 1.0);

        // update input struct.
        pbr_inputs.NdotL = NdotL;
        pbr_inputs.NdotH = NdotH;
        pbr_inputs.LdotH = LdotH;
        pbr_inputs.VdotH = VdotH;

        // Calculate the shading terms for the microfacet specular shading model
        vec3 F = specular_reflection(pbr_inputs);
        float G = geometric_occlusion(pbr_inputs);
        float D = microfacet_distribution(pbr_inputs);

        // Calculation of analytical lighting contribution
        vec3 diffuse_contribution = (1.0 - F) * diffuse(pbr_inputs);
        vec3 specular_contribution = F * G * D / (4.0 * NdotL * NdotV);

        // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
        color += (diffuse_contribution + specular_contribution) * NdotL * light_color * attenuation;

    }

    // Calculate lighting contribution from image based lighting source (IBL)
    #ifdef USE_IBL
        color += get_ibl_contribution(pbr_inputs, n, reflection);
    #endif

    // Apply optional PBR terms for additional (optional) shading
    #ifdef HAS_OCCLUSIONMAP
        float ao = texture(u_occlusion_sampler, texcoord_0).r;
        color = mix(color, color * ao, u_occlusion_strength);
    #endif

    #ifdef HAS_EMISSIVEMAP
        vec3 emissive = srgb_to_linear(texture(u_emissive_sampler, texcoord_0)).rgb * u_emissive_factor;
        color += emissive;
    #endif

    out_color = vec4(pow(color, vec3(1.0/2.2)), base_color.a);
}