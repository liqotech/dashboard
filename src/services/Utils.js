export default class Utils {
  constructor() {
    this.result = [];
  }

  /**
   * Function that transform string in dot notation and get the params from an object
   * @param obj: from which the function get the item
   * @param is: the string that gives the path
   * @param value
   * @returns list of params retrieved from an object
   */
  index(obj, is, value) {
    try{
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          this.index(item, is);
        });
      } else {
        if (typeof is == 'string'){
          return this.index(obj,is.split('.'), value);
        }
        else if (is.length===1 && value!==undefined){
          return obj[is[0]] = value;
        }
        else if (is.length===0){
          this.result.push(obj);
          return obj;
        }
        else
          return this.index(obj[is[0]],is.slice(1), value);
      }
    } catch {
      return;
    }

    let res = this.result;
    this.result = [];
    return res;
  }

  /**
   * Converts the OpenApiV3 schema to a JSON schema
   * @param schema: the OAPIV3 schema
   * @returns the converted schema
   */
  OAPIV3toJSONSchema(schema){
    let toJsonSchema = require('@openapi-contrib/openapi-schema-to-json-schema');

    return toJsonSchema(schema);
  }
}
