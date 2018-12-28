#version 300 es

__DEFINES__

#define MANUAL_SRGB // TODO: investigate use of gamma correction.

precision highp float;

const uint LIGHT_DIRECTIONAL = 0U;
const uint LIGHT_POINT = 1U;
const uint LIGHT_SPOT = 2U;

uniform int u_NumberOfLights;

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

#ifdef USE_IBL
    uniform samplerCube u_DiffuseEnvSampler;
    uniform samplerCube u_SpecularEnvSampler;
    uniform sampler2D u_brdfLUT;
#endif

#ifdef HAS_BASECOLORMAP
    uniform sampler2D u_BaseColorSampler;
#endif
#ifdef HAS_NORMALMAP
    uniform sampler2D u_NormalSampler;
    uniform float u_NormalScale;
#endif
#ifdef HAS_EMISSIVEMAP
    uniform sampler2D u_EmissiveSampler;
    uniform vec3 u_EmissiveFactor;
#endif
#ifdef HAS_METALROUGHNESSMAP
    uniform sampler2D u_MetallicRoughnessSampler;
#endif
#ifdef HAS_OCCLUSIONMAP
    uniform sampler2D u_OcclusionSampler;
    uniform float u_OcclusionStrength;
#endif

uniform vec2 u_MetallicRoughnessValues;
uniform vec4 u_BaseColorFactor;
uniform vec3 u_Camera;

in vec3 position;
in vec2 texcoord_0;

in mat3 TBN;

out vec4 fColor;

// Encapsulate the various inputs used by the various functions in the shading equation
// We store values in this struct to simplify the integration of alternative implementations
// of the shading terms, outlined in the Readme.MD Appendix.
struct PBRInfo {
    float NdotL;                  // cos angle between normal and light direction
    float NdotV;                  // cos angle between normal and view direction
    float NdotH;                  // cos angle between normal and half vector
    float LdotH;                  // cos angle between light direction and half vector
    float VdotH;                  // cos angle between view direction and half vector
    float perceptualRoughness;    // roughness value, as authored by the model creator (input to shader)
    float metalness;              // metallic value at the surface
    vec3 reflectance0;            // full reflectance color (normal incidence angle)
    vec3 reflectance90;           // reflectance color at grazing angle
    float alphaRoughness;         // roughness mapped to a more linear change in the roughness (proposed by [2])
    vec3 diffuseColor;            // color contribution from diffuse lighting
    vec3 specularColor;           // color contribution from specular lighting
};

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

vec4 SRGBtoLINEAR(vec4 srgbIn) {
    #ifdef MANUAL_SRGB
    #ifdef SRGB_FAST_APPROXIMATION
    vec3 linOut = pow(srgbIn.xyz,vec3(2.2));
    #else //SRGB_FAST_APPROXIMATION
    vec3 bLess = step(vec3(0.04045),srgbIn.xyz);
    vec3 linOut = mix( srgbIn.xyz/vec3(12.92), pow((srgbIn.xyz+vec3(0.055))/vec3(1.055),vec3(2.4)), bLess );
    #endif //SRGB_FAST_APPROXIMATION
    return vec4(linOut,srgbIn.w);
    #else //MANUAL_SRGB
    return srgbIn;
    #endif //MANUAL_SRGB
}

// Find the normal for this fragment, pulling either from a predefined normal map
// or from the interpolated mesh normal and tangent attributes.
vec3 getNormal() {
    // Retrieve the tangent space matrix
    mat3 tbn = TBN;

    #ifdef HAS_NORMALMAP

    vec3 n = texture(u_NormalSampler, texcoord_0).rgb;
    n = normalize(tbn * ((2.0 * n - 1.0) * vec3(u_NormalScale, u_NormalScale, 1.0)));

    #else

    // The tbn matrix is linearly interpolated, so we need to re-normalize
    vec3 n = normalize(tbn[2].xyz);

    #endif

    return n;
}

// Calculation of the lighting contribution from an optional Image Based Light source.
// Precomputed Environment Maps are required uniform inputs and are computed as outlined in [1].
// See our README.md on Environment Maps [3] for additional discussion.
#ifdef USE_IBL
vec3 getIBLContribution(PBRInfo pbrInputs, vec3 n, vec3 reflection) {
    float mipCount = 9.0; // resolution of 512x512
    float lod = (pbrInputs.perceptualRoughness * mipCount);
    // retrieve a scale and bias to F0. See [1], Figure 3
    vec3 brdf = SRGBtoLINEAR(texture(u_brdfLUT, vec2(pbrInputs.NdotV, 1.0 - pbrInputs.perceptualRoughness))).rgb;
    vec3 diffuseLight = SRGBtoLINEAR(textureCube(u_DiffuseEnvSampler, n)).rgb;

#ifdef USE_TEX_LOD
    vec3 specularLight = SRGBtoLINEAR(textureCubeLodEXT(u_SpecularEnvSampler, reflection, lod)).rgb;
#else
    vec3 specularLight = SRGBtoLINEAR(textureCube(u_SpecularEnvSampler, reflection)).rgb;
#endif

    vec3 diffuse = diffuseLight * pbrInputs.diffuseColor;
    vec3 specular = specularLight * (pbrInputs.specularColor * brdf.x + brdf.y);

    // For presentation, this allows us to disable IBL terms
    diffuse *= u_ScaleIBLAmbient.x;
    specular *= u_ScaleIBLAmbient.y;

    return diffuse + specular;
}
#endif

// Basic Lambertian diffuse
// Implementation from Lambert's Photometria https://archive.org/details/lambertsphotome00lambgoog
// See also [1], Equation 1
vec3 diffuse(PBRInfo pbrInputs) {
    return pbrInputs.diffuseColor / M_PI;
}

// The following equation models the Fresnel reflectance term of the spec equation (aka F())
// Implementation of fresnel from [4], Equation 15
vec3 specularReflection(PBRInfo pbrInputs) {
    return pbrInputs.reflectance0 + (pbrInputs.reflectance90 - pbrInputs.reflectance0) * pow(clamp(1.0 - pbrInputs.VdotH, 0.0, 1.0), 5.0);
}

// This calculates the specular geometric attenuation (aka G()),
// where rougher material will reflect less light back to the viewer.
// This implementation is based on [1] Equation 4, and we adopt their modifications to
// alphaRoughness as input as originally proposed in [2].
float geometricOcclusion(PBRInfo pbrInputs) {
    float NdotL = pbrInputs.NdotL;
    float NdotV = pbrInputs.NdotV;
    float r = pbrInputs.alphaRoughness;

    float attenuationL = 2.0 * NdotL / (NdotL + sqrt(r * r + (1.0 - r * r) * (NdotL * NdotL)));
    float attenuationV = 2.0 * NdotV / (NdotV + sqrt(r * r + (1.0 - r * r) * (NdotV * NdotV)));
    return attenuationL * attenuationV;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
float microfacetDistribution(PBRInfo pbrInputs) {
    float roughnessSq = pbrInputs.alphaRoughness * pbrInputs.alphaRoughness;
    float f = (pbrInputs.NdotH * roughnessSq - pbrInputs.NdotH) * pbrInputs.NdotH + 1.0;
    return roughnessSq / (M_PI * f * f);
}

// Punctual light attenuation
/* From Frostbite PBR Course
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


void main() {
    // Metallic and Roughness material properties are packed together
    // In glTF, these factors can be specified by fixed scalar values
    // or from a metallic-roughness map
    float perceptualRoughness = u_MetallicRoughnessValues.y;
    float metallic = u_MetallicRoughnessValues.x;

    #ifdef HAS_METALROUGHNESSMAP
        // Roughness is stored in the 'g' channel, metallic is stored in the 'b' channel.
        // This layout intentionally reserves the 'r' channel for (optional) occlusion map data
        vec4 mrSample = texture(u_MetallicRoughnessSampler, texcoord_0);
        perceptualRoughness = mrSample.g * perceptualRoughness;
        metallic = mrSample.b * metallic;
    #endif

    perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
    metallic = clamp(metallic, 0.0, 1.0);

    // Roughness is authored as perceptual roughness; as is convention,
    // convert to material roughness by squaring the perceptual roughness [2].
    float alphaRoughness = perceptualRoughness * perceptualRoughness;

    // The albedo may be defined from a base texture or a flat color
    #ifdef HAS_BASECOLORMAP
        vec4 baseColor = SRGBtoLINEAR(texture(u_BaseColorSampler, texcoord_0)) * u_BaseColorFactor;
    #else
        vec4 baseColor = u_BaseColorFactor;
    #endif

    vec3 f0 = vec3(0.04);
    vec3 diffuseColor = baseColor.rgb * (vec3(1.0) - f0);
    diffuseColor *= 1.0 - metallic;
    vec3 specularColor = mix(f0, baseColor.rgb, metallic);

    // Compute reflectance.
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);

    // For typical incident reflectance range (between 4% to 100%) set the grazing reflectance to 100% for typical fresnel effect.
    // For very low reflectance range on highly diffuse objects (below 4%), incrementally reduce grazing reflecance to 0%.
    float reflectance90 = clamp(reflectance * 25.0, 0.0, 1.0);
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;

    vec3 n = getNormal();                             // normal at surface point
    vec3 v = normalize(u_Camera - position);          // Vector from surface point to camera
    vec3 reflection = -normalize(reflect(v, n));

    float NdotV = clamp(abs(dot(n, v)), 0.001, 1.0);

    PBRInfo pbrInputs = PBRInfo(
        0.0, // filled in later for each light.
        NdotV,
        0.0, // filled in later for each light.
        0.0, // filled in later for each light.
        0.0, // filled in later for each light.
        perceptualRoughness,
        metallic,
        specularEnvironmentR0,
        specularEnvironmentR90,
        alphaRoughness,
        diffuseColor,
        specularColor
    );
    
    vec3 color = vec3(0.0, 0.0, 0.0);

    for (int i = 0; i < MAX_NUMBER_OF_LIGHTS; i++) {
        if (i >= u_NumberOfLights) break; // TODO: check if this is faster than a dynamic loop.

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
        pbrInputs.NdotL = NdotL;
        pbrInputs.NdotH = NdotH;
        pbrInputs.LdotH = LdotH;
        pbrInputs.VdotH = VdotH;

        // Calculate the shading terms for the microfacet specular shading model
        vec3 F = specularReflection(pbrInputs);
        float G = geometricOcclusion(pbrInputs);
        float D = microfacetDistribution(pbrInputs);

        // Calculation of analytical lighting contribution
        vec3 diffuseContrib = (1.0 - F) * diffuse(pbrInputs);
        vec3 specContrib = F * G * D / (4.0 * NdotL * NdotV);

        // Obtain final intensity as reflectance (BRDF) scaled by the energy of the light (cosine law)
        color += (diffuseContrib + specContrib) * NdotL * light_color * attenuation;

    }

    // Calculate lighting contribution from image based lighting source (IBL)
    #ifdef USE_IBL
        color += getIBLContribution(pbrInputs, n, reflection);
    #endif

    // Apply optional PBR terms for additional (optional) shading
    #ifdef HAS_OCCLUSIONMAP
        float ao = texture(u_OcclusionSampler, texcoord_0).r;
        color = mix(color, color * ao, u_OcclusionStrength);
    #endif

    #ifdef HAS_EMISSIVEMAP
        vec3 emissive = SRGBtoLINEAR(texture(u_EmissiveSampler, texcoord_0)).rgb * u_EmissiveFactor;
        color += emissive;
    #endif

    fColor = vec4(pow(color, vec3(1.0/2.2)), baseColor.a);
}