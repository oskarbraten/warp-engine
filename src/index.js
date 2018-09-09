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


import { default as importer } from './lib/importer';
import { default as renderer } from './lib/core/renderer';

import { default as node } from './lib/graph/node';

import { default as orthographic } from './lib/camera/orthographic';
import { default as perspective } from './lib/camera/perspective';


export default {
    node,
    importer,
    renderer,
    perspectiveCamera: perspective,
    orthographicCamera: orthographic
};
