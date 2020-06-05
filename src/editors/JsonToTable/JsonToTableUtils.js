
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

  /**
   * Find key in an object recursively
   * @param object
   * @param key
   * @returns {*}
   */
  findVal(object, key, replacement) {
    let utils = new JsonToTableUtils();
    let value = undefined;
    let total = {
      value: value,
      object: object
    };
    Object.keys(object).some(function(k) {
      if (k === key) {
        if(replacement) {
          if(Object.keys(replacement).length === 0){
            object[k] = {};
          } else {
            object[k] = JSON.parse(JSON.stringify(replacement));
          }
        } else {
          value = object[k];
        }
        total = {
          value: value,
          object: object
        }
        return true;
      }
      if (object[k] && typeof object[k] === 'object') {
        total = utils.findVal(object[k], key, replacement);
        if(replacement) {
          object[k] = total.object;
          total.object = object;
        }
        return total.value !== undefined;
      }
    });
    return total;
  }
}
