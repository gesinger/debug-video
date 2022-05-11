export const getErrorString = ({ name, code, message }) =>
  `${code ? `[${code}] ` : ''}${name ? `${name}` : ''}${message ? `: ${message}` : ''}`;
