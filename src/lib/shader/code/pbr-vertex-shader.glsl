#version 300 es

__DEFINES__

layout(location = 0) in vec4 in_position;
layout(location = 1) in vec4 in_normal;
layout(location = 2) in vec4 in_tangent;
layout(location = 3) in vec2 in_texcoord_0;

uniform mat4 u_model_view_projection_matrix;
uniform mat4 u_model_view_matrix;
uniform mat3 u_normal_matrix;

out vec3 position;
out vec2 texcoord_0;

out mat3 TBN;

void main() {
    vec4 pos = u_model_view_matrix * in_position;
    position = vec3(pos.xyz) / pos.w;
    
    vec3 normal_w = normalize(u_normal_matrix * in_normal.xyz);
    vec3 tangent_w = normalize(vec3(u_model_view_matrix * vec4(in_tangent.xyz, 0.0)));
    vec3 bitangent_w = cross(normal_w, tangent_w) * in_tangent.w;
    TBN = mat3(tangent_w, bitangent_w, normal_w);

    texcoord_0 = in_texcoord_0;

    gl_Position = u_model_view_projection_matrix * in_position;
}
