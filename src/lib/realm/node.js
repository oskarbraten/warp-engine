/**
 * Node
 * A node in the node hierarchy.
 */

import { mat4, quat } from 'gl-matrix';

export default ({

    name = null,

    parent = null,
    children = [],

    mesh = null,
    camera = null,

    rotation = null,
    translation = null,
    scale = null,

    matrix = mat4.create()

}) => {

    const node = {

        name,

        parent,
        children,

        mesh,
        camera,

        matrix,
        worldMatrix: mat4.create(),

        add(child) {
            if (child && this.children.indexOf(child) === -1) {
                this.children.push(child);
            }
        },

        remove(child) {
            if (child) {
                let index = this.children.indexOf(child);

                if (index !== -1) {
                    this.children.splice(index, 1);
                    child.parent = null;
                }
            }
        },

        setScale(x, y, z) {
            this.scale[0] = x;
            this.scale[1] = y;
            this.scale[2] = z;
        },

        applyScale(x, y, z) {
            this.scale[0] *= x;
            this.scale[1] *= y;
            this.scale[2] *= z;
        },

        setTranslation(x, y, z) {
            this.translation[0] = x;
            this.translation[1] = y;
            this.translation[2] = z;
        },

        applyTranslation(x, y, z) {
            this.translation[0] += x;
            this.translation[1] += y;
            this.translation[2] += z;
        },

        setRotationFromEuler(x, y, z) {
            quat.fromEuler(this.rotation, x, y, z);
        },

        applyRotationX(rad) {
            quat.rotateX(this.rotation, this.rotation, rad);
        },

        applyRotationY(rad) {
            quat.rotateY(this.rotation, this.rotation, rad);
        },

        applyRotationZ(rad) {
            quat.rotateZ(this.rotation, this.rotation, rad);
        }
    };

    if (rotation !== null && translation !== null && scale !== null) {
        mat4.fromRotationTranslationScale(node.matrix, rotation, translation, scale);
    }

    return node;
};