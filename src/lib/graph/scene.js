/**
 * Scene
 * A collection of root nodes of a scene.
 */

export default (nodes = [], name = null) => {

    return {

        nodes,
        name,
        
        updateTransforms() {

            for (let i = 0; i < this.nodes.length; i++) {
                this.nodes[i].tick();
            }

        },

        acquireRenderables() {

            const renderables = [];


            for (let i = 0; i < this.nodes.length; i++) {

                const node = this.nodes[i];

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

        },

        acquireLights() {

            const lights = [];

            for (let i = 0; i < this.nodes.length; i++) {

                const node = this.nodes[i];

                if (node.light) {

                    lights.push([
                        node.light,
                        node.worldMatrix
                    ]);

                }

            }

            // TODO: perform frustum culling?


            return lights;
            
        }
        
    };

};