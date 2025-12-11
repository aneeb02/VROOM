export const loadTensorflowModel = async () => {
  console.warn("TensorFlow Lite is not supported on the web.");
  throw new Error("TensorFlow Lite is not supported on the web.");
};
