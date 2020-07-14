/**
 * Add space between camelCase text.
 */
export function unCamelCase(str) {
  str = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, "$1 $2");
  str = str.toLowerCase(); //add space between camelCase text
  return str;
}

/**
 * UPPERCASE first char of each word.
 */
export function properCase(str) {
  return lowerCase(str).replace(/^\w|\s\w/g, upperCase);
}

/**
 * "Safer" String.toUpperCase()
 */
export function upperCase(str) {
  return str.toUpperCase();
}

/**
 * "Safer" String.toLowerCase()
 */
export function lowerCase(str) {
  return str.toLowerCase();
}

export function splitCamelCaseAndUp(str) {
  str = unCamelCase(str);
  str = properCase(str);
  return str;
}
