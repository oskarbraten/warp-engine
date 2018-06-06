/**
 * Node
 * A simple SceneGraph node.
 */

import { vec3, mat4, quat } from 'gl-matrix';

export default class Node {

    constructor(parent = null) {
        this.localMatrix = mat4.create();
        this.worldMatrix = mat4.create();

        this.position = vec3.fromValues(0, 0, 0);
        this.scale = vec3.fromValues(1, 1, 1);
        this.rotation = quat.create();

        this.parent = parent;

        if (parent) {
            parent.add(this);
        }

        this.children = [];
    }

    add(child) {
        if (child && this.children.indexOf(child) === -1) {
            this.children.push(child);
            child.parent = this;
        }
    }

    remove(child) {
        if (child) {
            let index = this.children.indexOf(child);

            if (index !== -1) {
                this.children.splice(index, 1);
                child.parent = null;
            }
        }
    }

    tick() {
        this.updateLocalMatrix(); // Recalculate this node's localMatrix.

        // Do this if the node has a parent
        if (this.parent !== null) {

            // Multiply the localMatrix of this node with the worldMatrix of its parent.
            mat4.multiply(this.worldMatrix, this.parent.worldMatrix, this.localMatrix);

        } else {

            //Just set the localMatrix as the worldMatrix since this node does not have a parent
            mat4.copy(this.worldMatrix, this.localMatrix);

        }

        // Propagate the update downwards in the scene tree 
        //(the children will use this node's worldMatrix in the tick)
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].tick();
        }
        
    }

    updateLocalMatrix() {
        mat4.fromRotationTranslationScale(this.localMatrix, this.rotation, this.position, this.scale);
    }

    setScale(x, y, z) {
        this.scale[0] = x;
        this.scale[1] = y;
        this.scale[2] = z;
    }

    scale(x, y, z) {
        this.scale[0] *= x;
        this.scale[1] *= y;
        this.scale[2] *= z;
    }

    setPosition(x, y, z) {
        this.position[0] = x;
        this.position[1] = y;
        this.position[2] = z;
    }

    translate(x, y, z) {
        this.position[0] += x;
        this.position[1] += y;
        this.position[2] += z;
    }

    setRotationFromEuler(x, y, z) {
        quat.fromEuler(this.rotation, x, y, z);
    }

    rotateX(rad) {
        quat.rotateX(this.rotation, this.rotation, rad);
    }

    rotateY(rad) {
        quat.rotateY(this.rotation, this.rotation, rad);
    }

    rotateZ(rad) {
        quat.rotateZ(this.rotation, this.rotation, rad);
    }
}