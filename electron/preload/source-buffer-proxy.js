const createSourceBufferProxy = (sourceBuffer, mimeType, sendEvent) => {
  const origAppendBuffer = sourceBuffer.appendBuffer.bind(sourceBuffer);

  sourceBuffer.appendBuffer = (source) => {
    sendEvent('append-buffer', {
      mimeType,
      source
    });
    return origAppendBuffer(source);
  };

  return sourceBuffer;
};

module.exports = {
  createSourceBufferProxy
};
