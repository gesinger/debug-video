const Decrypter = require('aes-decrypter').Decrypter;
const { downloadFile } = require('./network');
const { bufferToUint8Array } = require('./bytes');

const aesDecrypt = ({ buffer, key, iv }) => {
  return new Promise((resolve, reject) => {
    const decrypter = new Decrypter(
      buffer,
      key,
      iv,
      (err, decryptedBuffer) => {
        // aes-decrypter won't pass an error, it will always be null
        resolve(decryptedBuffer);
      }
    );
  });
};

const decrypt = async ({ buffer, keyBytes, keyUrl, iv, signal }) => {
  if (!keyBytes) {
    const downloadResult = await downloadFile({ url: keyUrl, signal });

    if (downloadResult.error) {
      return { error: downloadResult.error };
    }

    const keyDataView = new DataView(
      downloadResult.buffer.buffer,
      downloadResult.buffer.byteOffset,
      downloadResult.buffer.byteLength
    );

    keyBytes = [
      keyDataView.getUint32(0),
      keyDataView.getUint32(4),
      keyDataView.getUint32(8),
      keyDataView.getUint32(12),
    ];
  }

  const decryptedBuffer = await aesDecrypt({
    buffer: bufferToUint8Array(buffer),
    key: keyBytes,
    iv,
    signal,
  });

  return { buffer: decryptedBuffer, keyBytes };
};

module.exports = {
  decrypt,
};
