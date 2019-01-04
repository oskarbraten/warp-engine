#version 300 es

__DEFINES__

layout(location = 0) in vec4 in_position;
layout(location = 1) in vec3 in_normal;
layout(location = 2) in vec4 in_tangent;

uniform mat4 u_model_view_projection_matrix;
uniform mat4 u_model_view_matrix;
uniform mat3 u_normal_matrix;

out vec3 position;
out vec2 texcoord_0;
out mat3 TBN;

#ifdef HAS_TEXCOORD_0
layout(location = 3) in vec2 in_texcoord_0;
#endif

#ifdef HAS_TEXCOORD_1
layout(location = 4) in vec2 in_texcoord_1;
out vec2 texcoord_1;
#endif

#if defined(HAS_JOINTS_0) && defined(HAS_WEIGHTS_0)
layout(location = 6) in vec4 in_joints_0;
layout(location = 7) in vec4 in_weights_0;

uniform mat4 u_joint_matrix[12];
#endif


void main() {
    vec4 pos = u_model_view_matrix * in_position;
    position = vec3(pos.xyz) / pos.w;
    
    vec3 normal_w = normalize(u_normal_matrix * in_normal);
    vec3 tangent_w = normalize(vec3(u_model_view_matrix * in_tangent));
    vec3 bitangent_w = cross(normal_w, tangent_w) * in_tangent.w;
    TBN = mat3(tangent_w, bitangent_w, normal_w);

    #ifdef HAS_TEXCOORD_0
    texcoord_0 = in_texcoord_0;
    #else
    texcoord_0 = vec2(0.0);
    #endif

    #ifdef HAS_TEXCOORD_1
    texcoord_1 = in_texcoord_1;
    #endif

    #if defined(HAS_JOINTS_0) && defined(HAS_WEIGHTS_0)
    mat4 skin_matrix = 
        in_weights_0.x * u_joint_matrix[int(in_joints_0.x)] +
        in_weights_0.y * u_joint_matrix[int(in_joints_0.y)] +
        in_weights_0.z * u_joint_matrix[int(in_joints_0.z)] +
        in_weights_0.w * u_joint_matrix[int(in_joints_0.w)];

    gl_Position = u_model_view_projection_matrix * skin_matrix * in_position;
    #else
    gl_Position = u_model_view_projection_matrix * in_position;
    #endif
}
