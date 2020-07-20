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
    //TODO: Workaround for now
    try{this.formatSchema(schema);} catch{}
    return toJsonSchema(schema);
  }

  /**
   * The field 'format' is not accepted in the Json schema,
   * so we get rid of it before converting
   * @param schema
   */
  formatSchema(schema) {
    Object.keys(schema).forEach(key => {
      if(schema[key] && key !== 'description' && key !== 'type' && key !== 'required'){
        if(schema[key].type){
          if(schema[key].type === 'object'){
            this.formatSchema(schema[key]);
          } else {
            if(schema[key].format){
              delete schema[key].format;
            }
          }
        } else {
          this.formatSchema(schema[key]);
        }
      }
    })
  }


  setDefault(schema, config) {
    try{
      Object.keys(schema).forEach(key => {
        if(schema[key] && key !== 'description' && key !== 'type' && key !== 'required') {
          if (schema[key].type) {
            if (schema[key].type === 'object') {
              this.setDefault(schema[key], config[key]);
            } else {
              schema[key].default = config[key];
            }
          } else {
            this.setDefault(schema[key], config);
          }
        }
      })
    } catch {
      return;
    }
  }

}
