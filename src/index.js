/**
 * Warp
 * A super simple WebGL2 javascript library.
 * Written by Oskar Bråten, 13/10/2017
 */

/**
 * TODO:
 * 	- Generalize material drawing pipeline.				[ ]
 * 	- Add support for custom materials with shaders.	[ ]
 * 	- Make camera a vaild scene node.					[ ]
 * 	- Implement proper primitive geometry classes.		[x]
 * 	- Add support for indexing.							[x]
 * 	- Add support for multitexturing.					[ ]
 * 	- Add support for light sources. 					[x]
 * 	- Rewrite lighting with UBO.						[ ]
 * 	- Improve performance by presorting scene 			[ ]
 * 	- Improve performance by sorting SceneGraph			[ ]
 */

export { default as Node } from './lib/Node';