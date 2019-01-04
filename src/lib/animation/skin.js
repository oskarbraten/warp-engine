
export default ({

    joints,
    skeleton = null,
    inverseBindMatrices = null

}, name) => {
    return {

        joints,
        skeleton,
        inverseBindMatrices,

        name

    };
};