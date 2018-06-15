#version 300 es

precision highp float;

in vec2 fTextureCoordinate;

uniform vec4 color;

uniform bool hasMap;
uniform sampler2D map;

out vec4 fColor;

void main() {
    fColor = color;
    
    if (hasMap) {
        fColor *= texture(map, fTextureCoordinate);
    }
}