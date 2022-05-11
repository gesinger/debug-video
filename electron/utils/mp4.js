const { bytesMatch } = require('@videojs/vhs-utils/cjs/byte-helpers');

const FTYP_BYTES = new Uint8Array([0x66, 0x74, 0x79, 0x70]);
const STYP_BYTES = new Uint8Array([0x73, 0x74, 0x79, 0x70]);
const MOOF_BYTES = new Uint8Array([0x6D, 0x6F, 0x6F, 0x66]);
const MOOV_BYTES = new Uint8Array([0x6D, 0x6F, 0x6F, 0x76]);

const isInitSegment = (bytes) => {
  return bytesMatch(bytes, FTYP_BYTES, {offset: 4});
};

const isMp4 = (bytes) => {
  return bytesMatch(
    bytes, FTYP_BYTES, {offset: 4}) ||
    bytesMatch(bytes, STYP_BYTES, {offset: 4}) ||
    bytesMatch(bytes, MOOF_BYTES, {offset: 4}) ||
    bytesMatch(bytes, MOOV_BYTES, {offset: 4}
  );
};

const toUnsigned = (value) => value >>> 0;

const parseOutInitSegment = (bytes) => {
  for (let i = 0; i < bytes.byteLength;) {
    const size = toUnsigned(
      (bytes[i] << 24) |
      (bytes[i + 1] << 16) |
      (bytes[i + 2] <<  8) |
      bytes[i + 3]
    );

    // Since box size includes the header (8 bytes), the size should at least be 8 bytes.
    // If it isn't, there may be an issue with the file.
    if (size < 8) {
      return null;
    }

    const end = i + size;

    // "An ISO BMFF initialization segment is defined in this specification as a single
    // File Type Box (ftyp) followed by a single Movie Header Box (moov)."
    //
    // https://www.w3.org/2013/12/byte-stream-format-registry/isobmff-byte-stream-format.html#iso-init-segments
    if (bytesMatch(bytes, MOOV_BYTES, {offset: i + 4})) {
      return bytes.subarray(0, end);
    }

    i = end;
  }

  return null;
};

module.exports = {
  isInitSegment,
  isMp4,
  parseOutInitSegment
};
