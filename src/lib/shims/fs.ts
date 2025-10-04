export const readFileSync = () => {
  throw new Error("Filesystem access is not supported in this environment.");
};

const fsShim = { readFileSync };

export default fsShim;
