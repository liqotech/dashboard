
/**
 * Class to manage all the interaction with the cluster
 */

export default function ApiManager() {

  let watchList = [];

  const getCRDs = () => {
    return fetch('http://localhost:3001/customresourcedefinition')
      .then(res => res.json()).then(res => {return {body: res}});
  }

  const getCustomResourcesAllNamespaces = item => {
    return fetch('http://localhost:3001/clustercustomobject/' + item.spec.names.plural)
      .then(res => res.json());
  }

  const deleteCustomResource = (group, version, namespace, plural, name) => {
    return fetch('http://localhost:3001/clustercustomobject/' + plural, { method: 'DELETE'})
      .then(res => res.json())
      .then((res) => {
        watchList.forEach(w => {
          if (w.plural === plural)
            w.callback('DELETED', res);
        })
      })
  }

  const createCustomResource = (group, version, namespace, plural, item) => {
    return fetch('http://localhost:3001/clustercustomobject/' + plural, { method: 'POST', body: item})
      .then(res => res.json())
      .then((res) => {
        watchList.forEach(w => {
          if(w.plural === 'views/' && plural === 'views'){
            w.callback('ADDED', res.body.items[0]);
          } else if (w.plural === plural)
            w.callback('ADDED', res.body);
        })
      });
  }

  const updateCustomResource = (group, version, namespace, plural, name, item) => {
    if (plural === 'liqodashtests' ||
      plural === 'clusterconfigs' ||
      plural === 'foreignclusters' ||
      plural === 'searchdomains' ||
      plural === 'advertisements' ||
      plural === 'views') {
      return fetch('http://localhost:3001/clustercustomobject/' + plural, { method: 'PUT', body: item })
        .then(res => res.json())
        .then((res) => {
          if(plural === 'views') {
            let itemDC = JSON.parse(JSON.stringify(item));
            itemDC.metadata.resourceVersion++;
            watchList.find(item => item.plural === (plural + '/')).callback('MODIFIED', itemDC);
            return Promise.resolve(new Response(JSON.stringify(item)))
          } else {
            watchList.forEach(w => {
              if (w.plural === plural)
                w.callback('MODIFIED', res.body);
            })
          }
          return res;
        });
    } else {
      return Promise.resolve(item);
    }
  }

  const updateCustomResourceDefinition = (name, item) => {
    let itemDC = JSON.parse(JSON.stringify(item));
    itemDC.metadata.resourceVersion++;
    watchList.find(item => item.plural === 'customresourcedefinitions')
      .callback('MODIFIED', itemDC);
    return Promise.resolve();
  }

  const watchFunction = (path, callback, done) => {
    let array = path.split('/');
    if(array[4] === 'views' && path.slice(-1) === '/')
      array[4] = 'views/';
    watchList.push({
      plural: array[4],
      callback: callback,
      done: done
    });
  }

  const getNamespaces = () => {
    return Promise.resolve({body: { items: [{ metadata: { name: 'test' }}]}});
  }

  const getPODs = () => {
    return fetch('http://localhost:3001/pod').then(res => res.json());
  }

  const getNodes = () => {
    return fetch('http://localhost:3001/nodes').then(res => res.json());
  }

  const fetchMetrics = path => {
    let array = path.split('/');
    if(array[4] === 'nodes')
      return getMetricsNodes();
    else return getMetricsPOD();
  }

  const getMetricsPOD = () => {
    return fetch('http://localhost:3001/metrics/pods/').then(res => res.json());
  }

  const getMetricsNodes = () => {
    return fetch('http://localhost:3001/metrics/nodes').then(res => res.json());
  }

  const getConfigMaps = namespace => {
    return fetch('http://localhost:3001/configmaps/' + namespace).then(res => res.json());
  }

  const sendDeletedSignal = (plural, CRD) => {
    watchList.find(item => item.plural === plural)
      .callback('DELETED', CRD);
  }

  const sendAddedSignal = (plural, CRD) => {
    watchList.find(item => item.plural === plural)
      .callback('ADDED', CRD);
  }

  const sendModifiedSignal = (plural, CRD) => {
    watchList.find(item => item.plural === plural)
      .callback('MODIFIED', CRD);
  }

  const sendAbortedConnectionSignal = plural => {
    watchList.find(item => item.plural === plural)
      .done();
  }

  return{
    getCRDs,
    getCustomResourcesAllNamespaces,
    deleteCustomResource,
    createCustomResource,
    updateCustomResource,
    updateCustomResourceDefinition,
    watchFunction,
    getNamespaces,
    getPODs,
    getNodes,
    fetchMetrics,
    getConfigMaps,
    sendDeletedSignal,
    sendAddedSignal,
    sendModifiedSignal,
    sendAbortedConnectionSignal
  }
}
