export function getResourceConfig(params){
  if(window.api.dashConfigs.current){
    let conf = window.api.dashConfigs.current.spec.resources.find(resource => {
      return resource.resourcePath === window.location.pathname;
    })
    if(!conf){
      let path = '/' + window.location.pathname.split('/')[1] + '/' +
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
