/**
 * Scene
 * A collection of root nodes of a scene.
 */



export default (nodes = [], name = null) => {

    return {
        nodes: nodes,
        name: name
    };

};

// import { vec4 } from 'gl-matrix';
// export default class Scene extends Node {
//     constructor(background = vec4.fromValues(1.0, 1.0, 1.0, 1.0)) {
//         super();
//         this.background = background;
//     }

//     getEntities() {
//         let entities = {
//             lights: [],
//             meshes: []
//         };

//         function extract(node) {
//             if (node.isMesh) {
//                 entities.meshes.push(node);
//             } else if (node.isLight) {
//                 entities.lights.push(node);
//             }

//             if (node.children.length > 0) {
//                 node.children.forEach((child) => {
//                     extract(child);
//                 });
//             }
//         }

//         extract(this);

//         return entities;
//     }
// }