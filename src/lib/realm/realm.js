/**
 * Realm
 */

export default () => {

    let realm = {

        buffers: [],
        bufferViews: [],
        accessors: [],
        cameras: [],
        meshes: [],
        nodes: [],
        scenes: [],

        scene: null,

        updateTransforms() {

            const nodes = this.scenes[this.scene].nodes;

            for (let i = 0; i < nodes.length; i++) {
                nodes.tick();
            }

        },

        acquireRenderables() {

            let renderables = [];

            const nodes = this.scenes[this.scene].nodes;

            for (let i = 0; i < nodes.length; i++) {

                const node = nodes[i];

                if (node.mesh) {

                    for (let j = 0; j < node.mesh.primitives.length; j++) {

                        renderables.push([
                            node.mesh.primitives[j],
                            node.worldMatrix
                        ]);
    
                    }

                }

            }

            // TODO: perform frustum culling based on camera (passed as parameter)
            // TODO: perform sorting, front to back, transparency, material-id, etc..

            return renderables;

        }

    };
    

};