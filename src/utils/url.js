export const getFilenameFromUrl = (url) => {
  try {
    return new URL(url).pathname.split('/').pop();
  } catch (e) {
    return url;
  }
};

export const getExtensionFromUrl = (url) => {
  try {
    return (new URL(url)).pathname.split('.').pop();
  } catch (e) {
    return url;
  }
};

export const isAbsoluteUrl = (url) => {
  try {
    return new URL(document.baseURI).origin !== new URL(url, document.baseURI).origin;
  } catch (e) {
    return false;
  }
};
