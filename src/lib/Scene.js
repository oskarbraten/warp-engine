/**
 * Scene
 * Just a special Node, with the additional function getDrawableNodes.
 */

import Node from './Node';

export default class Scene extends Node {
    constructor(background = 0x000000) {
        super();
        this.background = background;
    }

    getEntities() {
        let entities = {
            lights: [],
            meshes: []
        };

        function extract(node) {
            if (node.isMesh) {
                entities.meshes.push(node);
            } else if (node.isLight) {
                entities.lights.push(node);
            }

            if (node.children.length > 0) {
                node.children.forEach((child) => {
                    extract(child);
                });
            }
        }

        extract(this);

        return entities;
    }
}