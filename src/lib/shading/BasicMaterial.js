
import { vec4 } from 'gl-matrix'; 
import Material from './Material';
import BasicShader from './BasicShader';

export default class BasicMaterial extends Material {
    constructor({
        color = vec4.fromValues(1.0, 1.0, 0.0, 1.0),
        map = null
    } = {}) {
        super(BasicShader);

        this.uniforms.color = color;
        this.uniforms.map = map;
        this.uniforms.hasMap = map ? true : false;

    }
}