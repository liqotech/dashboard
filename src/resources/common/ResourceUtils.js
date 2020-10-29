import { message } from 'antd';
import _ from 'lodash';

export function resourceNotifyEvent(func, type, object){
  if(object.metadata.namespace && object.metadata.namespace !== window.api.namespace.current && window.api.namespace.current)
    return;

  func(prev => {
    let resource = prev.find((item) => {
      return item.metadata.name === object.metadata.name;
    });

    if(type === 'MODIFIED' || type === 'ADDED') {
      if(resource) {
        if(resource.metadata.resourceVersion !== object.metadata.resourceVersion){
          prev = prev.filter(item => item.metadata.name !== object.metadata.name);
          prev.push(object);
          prev.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
          message.success(object.kind + ' ' + object.metadata.name + ' modified');
          return [...prev];
        }
      } else {
        prev.push(object);
        prev.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
        message.success(object.kind + ' ' + object.metadata.name + ' added');
        return [...prev];
      }
    } else if (type === 'DELETED') {
      if(resource){
        prev = prev.filter(item => item.metadata.name !== resource.metadata.name);
        message.success(object.kind + ' ' + object.metadata.name + ' deleted');
        return [...prev];
      }
    }

    return prev;
  });
}

export function getNamespaced(path){
  let link = path.split('/').slice(0, -1).join('/');
  let resource = path.split('/').slice(-1)[0];

  return window.api.getGenericResource(link)
    .then(res => {
      return {
        namespaced: res.resources.find(item => {
          return item.name === resource;
        }).namespaced
      }
    }).catch(error => console.log(error));
}

export function filterResource(props, res){
  if(props.onRef.filter  === 'labels'){
    res = res.filter(item => {
      let flag = 0;
      _.keys(props.onRef.filterValues).forEach(key => {
        if(key.includes('app.kubernetes')) return;
        if(item.metadata.labels && item.metadata.labels[key] === props.onRef.filterValues[key])
          flag++;
      })
      return flag > 0;
    })
  }
  return res;
}
