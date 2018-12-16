#version 300 es

precision highp float;

layout(location = 0) in vec4 vPosition;

uniform mat4 modelViewProjectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

void main() {
    gl_Position = modelViewProjectionMatrix * vPosition;
}