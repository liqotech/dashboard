import _ from 'lodash';
import Cookies from 'js-cookie';

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
          if(schema[key].type === 'object' || schema[key].type === 'array'){
            formatSchema(schema[key]);
          } else {
            if(schema[key].format){
              delete schema[key].format;
            }
          }
        } else {
          if(schema[key].anyOf) {
            delete schema[key].anyOf;
            schema[key].type = 'string';
          }
          if(schema[key].oneOf) {
            delete schema[key].oneOf;
            schema[key].type = 'string';
          }
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

  let objectSet = {};

  const getSelectedProperties = (object, searchedKey, path) => {
    try{
      if(typeof object === 'object' && object !== null){
        Object.keys(object).forEach(key => {
          let k = (path ? path + ' > ' : '') + key;
          if(key === searchedKey){
            objectSet = {
              ...objectSet,
              [k]: object[key]
            };
          }
          getSelectedProperties(object[key], searchedKey, (path ? path + ' > ' : '') + key);
        })
      }
    } catch {}

    return objectSet;
  }

  const fromDotToObject = (item, origResource) => {
    Object.keys(item).forEach(key => {
      Object.keys(item[key]).forEach(k => {
        _.set(origResource, k.replace(/\s>\s/gi, '.'), item[key][k])
      })
    })
    return origResource;
  }

  const replaceObject = (item, itemKey, origResource) => {
    Object.keys(origResource).forEach(key => {
      if(key === itemKey) {
        origResource[key] = item[key];
        return origResource;
      }
      if(typeof origResource[key] === 'object' || Array.isArray(origResource[key]))
        replaceObject(item, itemKey, origResource[key]);
    })
    return origResource;
  }

  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    a.sort();
    b.sort();

    for (let i = 0; i < a.length; ++i) {
      if(!_.isEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  function parseJWT(t) {
    let token = t ? t : getCookie();
    if (token) {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(
        decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => {
              return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
            })
            .join('')
        )
      );
    }
  }

  function getCookie() {
    let counter = 1;
    let token = Cookies.get('token');

    if (!token)
      return false;
    else {
      while (counter > 0) {
        let chunk = Cookies.get('token_' + counter);
        if (!chunk)
          counter = 0;
        else {
          token = token + chunk;
          counter++;
        }
      }
    }
    return token;
  }

  function removeCookie() {
    let counter = 1;
    Cookies.remove('token');

    while (counter > 0) {
      let chunk = Cookies.get('token_' + counter);
      if (!chunk)
        counter = 0;
      else {
        Cookies.remove('token_' + counter);
        counter++;
      }
    }
  }

  function setCookie(token) {
    let counter = 0;
    let props = { secure: true, sameSite: 'strict' };

    token.match(/(.|[\r\n]){1,4000}/g).forEach(chunk => {
      if (counter === 0)
        Cookies.set('token', chunk, props)
      else
        Cookies.set('token_' + counter, chunk, props)
      counter++;
    });
  }

  function csvToJson(file) {
    const csv = require('csvtojson');
    return csv().fromString(file);
  }

  return {
    setRealProperties,
    OAPIV3toJSONSchema,
    index,
    fromDotToObject,
    getSelectedProperties,
    replaceObject,
    arraysEqual,
    parseJWT,
    setCookie,
    getCookie,
    removeCookie,
    csvToJson
  }
}
