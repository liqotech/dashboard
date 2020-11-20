import _ from 'lodash';

export const createNewConfig = (params, props, location) => {
  let path = '/' + location.pathname.split('/')[1] + '/' +
    (params.group ? params.group + '/' : '') +
    params.version + '/' +
    params.resource;

  return {
    resourcePath: path,
    resourceName: props.kind,
    favourite: false,
    render: {
      columns: [
        {
          columnTitle: 'Name',
          columnContent: 'param.metadata.name'
        },
        {
          columnTitle: 'Namespace',
          columnContent: 'param.metadata.namespace'
        }
      ],
      tabs: []
    }
  }
}

export function getResourceConfig(params, location){
  if(!_.isEmpty(window.api.dashConfigs.current)){
    if(!window.api.dashConfigs.current.spec.resources)
      window.api.dashConfigs.current.spec.resources = [];
    let conf = window.api.dashConfigs.current.spec.resources.find(resource => {
      return resource.resourcePath === location.pathname;
    })
    if(!conf){
      let path = '/' + location.pathname.split('/')[1] + '/' +
        (params.group ? params.group + '/' : '') +
        params.version + '/' +
        params.resource;

      conf = window.api.dashConfigs.current.spec.resources.find(resource => {
        return resource.resourcePath === path;
      })
      if(!conf) return {}
    }
    return conf;
  }
  return {};
}

export function updateResourceConfig(tempResourceConfig, params, location){
  let CRD = window.api.getCRDFromKind('DashboardConfig');

  /** The resource has a config, update it */
  let path = '/' + location.pathname.split('/')[1] + '/' +
    (params.group ? params.group + '/' : '') +
    params.version + '/' +
    params.resource;

  let index = window.api.dashConfigs.current.spec.resources.indexOf(
    window.api.dashConfigs.current.spec.resources.find(resource =>
      resource.resourcePath === path
    ))

  if(index !== -1){
    window.api.dashConfigs.current.spec.resources[index] = tempResourceConfig;
  } else {
    window.api.dashConfigs.current.spec.resources.push(tempResourceConfig);
  }

  window.api.updateCustomResource(
    CRD.spec.group,
    CRD.spec.version,
    undefined,
    CRD.spec.names.plural,
    window.api.dashConfigs.current.metadata.name,
    window.api.dashConfigs.current
  ).catch(error => console.log(error))
}
