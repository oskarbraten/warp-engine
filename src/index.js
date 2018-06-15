/**
 * Warp
 * A super simple WebGL2 javascript library.
 * Written by Oskar Bråten, 13/10/2017.
 * ported to webpack and gl-matrix, 07/06/2018
 */

/**
 * TODO:
 * 	- Generalize material drawing pipeline.				[ ]
 * 	- Add support for custom materials with shaders.	[ ]
 * 	- Make camera a valid scene node.					[ ]
 * 	- Implement proper primitive geometry classes.		[x]
 * 	- Add support for indexing.							[x]
 * 	- Add support for multitexturing.					[ ]
 * 	- Add support for light sources. 					[x]
 * 	- Rewrite lighting with UBO.						[ ]
 * 	- Improve performance by presorting scene 			[ ]
 * 	- Improve performance by sorting SceneGraph			[ ]
 */

export { default as Node } from './lib/Node';
export { default as Mesh } from './lib/Mesh';
export { default as Scene } from './lib/Scene';
export { default as BoxGeometry } from './lib/geometry/BoxGeometry';
export { default as BasicMaterial } from './lib/shading/BasicMaterial';
export { default as Renderer } from './lib/Renderer';
export { default as PerspectiveCamera } from './lib/camera/PerspectiveCamera';

// export default {
//     Node,
//     Mesh,
//     Scene,
//     BoxGeometry,
//     BasicMaterial,
//     Renderer,
//     PerspectiveCamera
// };