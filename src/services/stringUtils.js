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
 * LOWERCASE and replace spaces with dashes
 */
export function dashLowercase(str) {
  return lowerCase(str).replace(/\s+/g, '-');
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
  if(str) {
    str = unCamelCase(str);
    str = properCase(str);
    return str;
  }
}

export function rootSplitCamelCaseAndUp(str) {
  const array = str.split("_");
  str = splitCamelCaseAndUp(array[array.length - 2]);
  str = str + ' (' + array.pop() + ')';
  return str;
}
