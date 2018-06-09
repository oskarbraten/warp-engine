#version 300 es

precision mediump float;

uniform vec4 color;
uniform sampler2D map;

out vec4 fColor;
in vec2 fTextureCoordinate;

void main() {
    fColor = color * texture(map, fTextureCoordinate);
}