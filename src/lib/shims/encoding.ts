const encodingShim = {};

export default encodingShim;

export const convert = () => {
  throw new Error("The encoding module is not available in this environment.");
};
