#version 300 es

__DEFINES__

layout(location = 0) in vec4 in_position;
layout(location = 1) in vec4 in_normal;
layout(location = 2) in vec4 in_tangent;
layout(location = 3) in vec2 in_texcoord_0;

uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

out vec3 position;
out vec2 texcoord_0;

out mat3 TBN;
out vec3 normal;

void main() {
    vec4 pos = modelMatrix * in_position;
    position = vec3(pos.xyz) / pos.w;
    
    vec3 normalW = normalize(vec3(normalMatrix * vec4(in_normal.xyz, 0.0)));
    vec3 tangentW = normalize(vec3(modelMatrix * vec4(in_tangent.xyz, 0.0)));
    vec3 bitangentW = cross(normalW, tangentW) * in_tangent.w;
    TBN = mat3(tangentW, bitangentW, normalW);

    texcoord_0 = in_texcoord_0;

    gl_Position = modelViewProjectionMatrix * in_position; // needs w for proper perspective correction
}
