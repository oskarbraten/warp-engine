import Shader from './Shader';

import basicVertexShader from './shaders/basic-vertex-shader.glsl';
import basicFragmentShader from './shaders/basic-fragment-shader.glsl';

export default class BasicShader extends Shader {
    constructor(gl) {
        super(gl, basicVertexShader, basicFragmentShader);

        // get specific uniform locations.
        this.uniformLocations.color = gl.getUniformLocation(this.program, 'color');
        this.uniformLocations.map = gl.getUniformLocation(this.program, 'map');
    }
}