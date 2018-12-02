#version 300 es

precision highp float;

layout(location = 0) in vec4 vPosition;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vPosition;
}