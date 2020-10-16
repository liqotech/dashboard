
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

  const getCustomResources = (item, namespace) => {
    return fetch('http://localhost:3001/clustercustomobject/' + item.spec.names.plural)
      .then(res => res.json()).then(res => {
        res.body.items = res.body.items.filter(item => item.metadata.namespace === namespace);
        return res;
      });
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
    watchList.find(item => item.plural === 'customresourcedefinitions/')
      .callback('MODIFIED', itemDC);
    return Promise.resolve();
  }

  const watchFunction = (path, callback, done) => {
    let array = path.split('/');
    if(array[4] === 'views' && path.slice(-1) === '/')
      array[4] = 'views/';
    if(array[4] === 'customresourcedefinitions' && path.slice(-1) === '/')
      array[4] = 'customresourcedefinitions/';
    watchList.push({
      plural: array[1] === 'api' ? (array[3] === 'namespaces' ? array[5] : array[4])
      : array[4],
      callback: callback,
      done: done
    });
  }

  const getNamespaces = () => {
    return fetch('http://localhost:3001/namespaces').then(res => res.json());
  }

  const getPODs = (namespace) => {
    return fetch('http://localhost:3001/pod')
      .then(res => res.json()).then(res => {
        res.body.items = res.body.items.filter(item => item.metadata.namespace === namespace);
        return res;
      });
  }

  const getPODsAllNamespaces = () => {
    return fetch('http://localhost:3001/pod').then(res => res.json());
  };

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

  const getApis = () => {
    return fetch('http://localhost:3001/apis/').then(res => res.json());
  }

  const fetchRaw = (path, method, item) => {
    let headers = new Headers();
    if(method === 'PATCH')
      headers.append("Content-Type", "application/merge-patch+json");

    let requestOptions = {
      method: method,
      headers: headers,
      redirect: 'follow',
      body: JSON.stringify(item)
    };

    return fetch(path, requestOptions).then(res => {
      return res.json()
    }).then(res => {
      let array = path.slice(20).split('/');
      let plural;
      if(array[1] === 'api'){
        if(array[3] === 'namespaces')
          plural = array[5];
        else plural = array[4];
      } else {
        if(array[3] === 'namespaces')
          plural = array[4];
        else plural = array[4];
      }
      //console.log(plural);
      if(method === 'PATCH' || method === 'POST')
        watchList.find(item => item.plural === plural)
          .callback(method === 'PATCH' ? 'MODIFIED' : 'ADDED', item);
      return Promise.resolve(res);
    });
  }

  const logFunction = (path) => {
    return fetch(path).then(res => res.text());
  }

  return{
    getCRDs,
    getCustomResources,
    getCustomResourcesAllNamespaces,
    deleteCustomResource,
    createCustomResource,
    updateCustomResource,
    updateCustomResourceDefinition,
    watchFunction,
    getNamespaces,
    getPODs,
    getPODsAllNamespaces,
    sendDeletedSignal,
    sendAddedSignal,
    sendModifiedSignal,
    sendAbortedConnectionSignal,
    getNodes,
    fetchMetrics,
    getConfigMaps,
    getApis,
    fetchRaw,
    logFunction
  }
}
