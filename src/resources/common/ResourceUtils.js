import { message } from 'antd';
import _ from 'lodash';
import React from 'react';

export function resourceNotifyEvent(func, type, object, noNamespaceCheck) {
  if (
    !noNamespaceCheck &&
    object.metadata.namespace &&
    object.metadata.namespace !== window.api.namespace.current &&
    window.api.namespace.current
  )
    return;

  func(prev => {
    let resource = prev.find(item => {
      return item.metadata.selfLink === object.metadata.selfLink;
    });

    if (type === 'MODIFIED' || type === 'ADDED') {
      if (resource) {
        if (
          resource.metadata.resourceVersion !== object.metadata.resourceVersion
        ) {
          prev = prev.filter(
            item => item.metadata.selfLink !== object.metadata.selfLink
          );
          prev.push(object);
          prev.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
          message.success(
            object.kind + ' ' + object.metadata.name + ' modified'
          );
          return [...prev];
        }
      } else {
        prev.push(object);
        prev.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
        message.success(object.kind + ' ' + object.metadata.name + ' added');
        return [...prev];
      }
    } else if (type === 'DELETED') {
      if (resource) {
        prev = prev.filter(
          item => item.metadata.selfLink !== resource.metadata.selfLink
        );
        message.success(object.kind + ' ' + object.metadata.name + ' deleted');
        return [...prev];
      }
    }

    return prev;
  });
}

export function getNamespaced(path) {
  let link = path.split('/').slice(0, -1).join('/');
  let resource = path.split('/').slice(-1)[0];

  return window.api
    .getGenericResource(link)
    .then(res => {
      return {
        namespaced: res.resources.find(item => {
          return item.name === resource;
        }).namespaced
      };
    })
    .catch(error => Promise.reject(error));
}

export function filterResource(props, res) {
  if (props.onRef.filter === 'labels') {
    res = res.filter(item => {
      let flag = 0;
      _.keys(props.onRef.filterValues).forEach(key => {
        if (key.includes('app.kubernetes')) return;
        if (
          item.metadata.labels &&
          item.metadata.labels[key] === props.onRef.filterValues[key]
        )
          flag++;
      });
      return flag > 0;
    });
  }
  return res;
}

export function searchDirectReferences(resource) {
  let result = [];
  recursiveSearch(resource);

  function recursiveSearch(obj) {
    _.keys(obj).forEach(key => {
      if (key.slice(-3) === 'Ref' && key.split('/').length === 2) {
        result.push({
          [key]: obj[key]
        });
      }
      if (typeof obj[key] === 'object') {
        recursiveSearch(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach(_obj => {
          recursiveSearch(_obj);
        });
      }
    });
  }

  return result;
}

export function searchResourceByKindAndGroup(kind, group) {
  return window.api.getApis('/').then(res => {
    let promises = res.body.groups
      .find(_group => _group.name === group)
      .versions.map(version => {
        return window.api
          .getGenericResource('/apis/' + version.groupVersion + '/')
          .then(res => {
            let resource = res.resources.find(r => r.kind === kind);
            if (resource) {
              return window.api
                .getGenericResource(
                  '/apis/' + version.groupVersion + '/' + resource.name
                )
                .then(res => {
                  return res;
                });
            }
          });
      });

    return Promise.all(promises).then(res => {
      let result;
      res.forEach(r => {
        if (r) result = r;
      });
      return result;
    });
  });
}
