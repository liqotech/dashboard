import Utils from '../../services/Utils';
import React from 'react';

export function columnContentFunction(resource, content) {
  let parameters = content.split('%//');
  if (parameters.length > 1) {
    let content = '';
    parameters.forEach(param => {
      if (param.slice(0, 6) === 'param.') {
        let object = Utils().index(resource, param.slice(6));
        if (typeof object === 'object' || Array.isArray(object))
          object = '[Object is not primary type]';
        content += object ? object : "''";
      } else {
        if (param.slice(0, 1) === "'" && param.slice(-1) === "'") {
          let string = param.slice(1, -1);
          content += string;
        }
      }
    });
    return content;
  } else {
    if (parameters[0].slice(0, 6) === 'param.')
      parameters[0] = parameters[0].slice(6);
    return Utils().index(resource, parameters[0]);
  }
}
