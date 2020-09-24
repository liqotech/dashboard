export default function Utils() {
  let result = [];

  /**
   * Function that transform string in dot notation and get the params from an object
   * @param obj: from which the function get the item
   * @param is: the string that gives the path
   * @param value
   * @returns list of params retrieved from an object
   */
  const index = (obj, is, value) => {
    try{
      if (Array.isArray(obj)) {
        obj.forEach(item => {
          index(item, is);
        });
      } else {
        if (typeof is == 'string'){
          return index(obj, is.split('.'), value);
        }
        else if (is.length === 1 && value !== undefined){
          return obj[is[0]] = value;
        }
        else if (is.length === 0){
          result.push(obj);
          return obj;
        }
        else
          return index(obj[is[0]], is.slice(1), value);
      }
    } catch {
      return;
    }

    let res = result;
    result = [];
    return res;
  }

  /**
   * Converts the OpenApiV3 schema to a JSON schema
   * @param schema: the OAPIV3 schema
   * @returns the converted schema
   */
  const OAPIV3toJSONSchema = schema => {
    let toJsonSchema = require('@openapi-contrib/openapi-schema-to-json-schema');
    //TODO: Workaround for now
    try{formatSchema(schema);} catch{}
    return toJsonSchema(schema);
  }

  /**
   * The field 'format' is not accepted in the Json schema,
   * so we get rid of it before converting
   * @param schema
   */
  const formatSchema = schema => {
    Object.keys(schema).forEach(key => {
      if(schema[key] && key !== 'description' && key !== 'type' && key !== 'required'){
        if(schema[key].type){
          if(schema[key].type === 'object'){
            formatSchema(schema[key]);
          } else {
            if(schema[key].format){
              delete schema[key].format;
            }
          }
        } else {
          formatSchema(schema[key]);
        }
      }
    })
  }

  const setRealProperties = (schemaGen, schemaReal) => {
    try{
      Object.keys(schemaGen).forEach(key => {
        if(schemaGen[key] && key !== 'description' && key !== 'type' && key !== 'required') {
          if (schemaGen[key].type) {
            if (schemaGen[key].type === 'object' || schemaGen[key].type === 'array' || !schemaGen[key].type) {
              setRealProperties(schemaGen[key], schemaReal[key]);
            } else {
              schemaGen[key] = schemaReal[key];
            }
          } else {
            setRealProperties(schemaGen[key], schemaReal[key]);
          }
        }
      })
    } catch {}
  }

  return{
    setRealProperties,
    OAPIV3toJSONSchema,
    index
  }
}
