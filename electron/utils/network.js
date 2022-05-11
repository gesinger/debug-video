const { http, https } = require('follow-redirects');

const CONTENT_RANGE_REGEX = /bytes ([0-9]+)-([0-9]+)\/[0-9]+/;

const getUrlKey = (url, byterange) => {
  if (!byterange) {
    return url;
  }

  return `${url}-start-${byterange.start}-end-${byterange.end}`;
};

const getByterange = (contentRangeHeader) => {
  const matches = contentRangeHeader.match(CONTENT_RANGE_REGEX);
  const start = matches[1];
  const end = matches[2];

  return { start, end };
};

const getResponseByterange = (responseHeaders) => {
  const contentRangeHeader = responseHeaders['Content-Range'];

  if (!contentRangeHeader) {
    return null;
  }

  return getByterange(contentRangeHeader);
};

const getRequestModule = (url) => {
  let protocol;

  try {
    protocol = (new URL(url)).protocol;
  } catch (e) {
    return { error: { name: e.name, code: e.code, message: e.message } };
  }

  return {
    requestModule: protocol === 'https:' ? https : http
  };
};

const downloadFile = ({ url, byterange, signal }) => {
  return new Promise((resolve, reject) => {
    const { requestModule, error: requestModuleError } = getRequestModule(url);

    if (requestModuleError) {
      resolve({ error: requestModuleError });
      return;
    }

    const headers = {};

    if (byterange) {
      headers['Range'] = `bytes=${byterange.start}-${byterange.end}`;
    }

    requestModule.get(url, { headers, signal }, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      if (statusCode > 299 || statusCode < 200) {
        resolve({
          error: {
            name: 'Non-Success Status Code',
            code: statusCode,
            message: `Failed to get "${url}"`,
          }
        });
        return;
      }

      let chunks = [];

      res.on('data', (chunk) => { chunks.push(chunk); });
      res.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType,
        });
      });
    });
  });
};

module.exports = {
  getUrlKey,
  downloadFile,
  getResponseByterange,
};
