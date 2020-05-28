
export default class JsonToTableUtils {
  /**
   * Get object type
   */
  getObjectType(obj) {
    if (obj !== null && typeof obj === "object") {
      if (Array.isArray(obj)) {
        return 'Array';
      } else {
        if (Object.keys(obj).length) {
          return 'ObjectWithNonNumericKeys';
        } else {
          return 'Object';
        }
      }
    } else {
      return 'Primitive';
    }
  }

  checkLabelTypes(labels) {
    const reduced = labels.reduce(
      (accumulator, value) =>
        accumulator + (isNaN(Number(value)) ? value : Number(value)),
      0
    );
    return typeof reduced === "number" ? "number" : "string";
  }

  getUniqueObjectKeys(anArray) {
    let labels = [];
    const objectType = 'Object';
    anArray.forEach(item => {
      labels = labels.concat(Object.keys(item)).filter((elem, pos, arr) => {
        return arr.indexOf(elem) === pos;
      });
    });

    return { labels, type: objectType };
  }
}
