import { mat4 } from 'gl-matrix';
import Node from '../Node';

export default class Camera extends Node {

    constructor() {
        super();

        this.viewMatrix = mat4.create();
    }

    tick() {
        super.tick();

        mat4.invert(this.viewMatrix, this.worldMatrix);
    }

}