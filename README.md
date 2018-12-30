# warp-engine

A WebGL2 graphics engine inspired by the GLTF2.0 format.


### TODO:

#### General:
- [ ] Primitive geometry utility functions
- [ ] Area lights

#### GLTF2.0:
- [x] General functionality.
- [ ] Animations
- [ ] Morph targets and sparse accesors
- [ ] Lights punctual
- [ ] Generate normals and tangents they're not supplied

#### Performance:
- [ ] Render queue sorting (transparency, depth, shader-id, etc..)

### Future TODO:
- [ ] Voxel global illumination?
- [ ] Deferred shading?



## Shader standard

### Attribute layout qualifiers

```glsl

layout(location = 0) // position
layout(location = 1) // normal
layout(location = 2) // tangent
layout(location = 3) // texcoord;

```
