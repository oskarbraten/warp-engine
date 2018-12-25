/**
 * Warp
 * A super simple WebGL2 javascript library.
 * Written by Oskar Bråten, 13/10/2017.
 * ported to webpack and gl-matrix, 07/06/2018
 */

import { default as importer } from './lib/importer';
import { default as renderer } from './lib/core/renderer';

import { default as node } from './lib/graph/node';

import camera from './lib/core/camera';
import light from './lib/core/light';

export default {
    node,
    importer,
    renderer,
    camera,
    light
};
