const bufferToArrayBuffer = (buffer) => {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

const bufferToUint8Array = (buffer) => {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
};

module.exports = {
  bufferToArrayBuffer,
  bufferToUint8Array,
}
