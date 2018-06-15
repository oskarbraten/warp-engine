# warp-engine

A super simple WebGL2 graphics library.


### TODO:

- [ ] Generalize material drawing pipeline.
- [ ] Add support for custom materials with shaders.
- [ ] Make camera a valid scene node.
- [x] Implement proper primitive geometry classes.
- [x] Add support for indexing.
- [ ] Add support for multitexturing.
- [x] Add support for light sources.
- [ ] Rewrite lighting with UBO.
- [ ] Improve performance by presorting scene
- [ ] Improve performance by sorting scene graph


### Future TODO:

- [ ] PBR shader
- [ ] Voxel global illumination



## Shader standard

### Attribute layout qualifiers

```glsl

layout(location = 0) // for vPosition
layout(location = 1) // for vTextureCoordinate;

```