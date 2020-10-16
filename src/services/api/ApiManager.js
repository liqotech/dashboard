import { ApiextensionsV1beta1Api, Config, CoreV1Api, ApisApi, CustomObjectsApi, watch } from '@kubernetes/client-node';

/**
 * Class to manage all the interaction with the cluster
 */

export default function ApiManager(user) {
  const config = new Config(window.APISERVER_URL, user.id_token, user.token_type);
  const apiExt = config.makeApiClient(ApiextensionsV1beta1Api);
  const apiCRD = config.makeApiClient(CustomObjectsApi);
  const apiCore = config.makeApiClient(CoreV1Api);
  const apiApis = config.makeApiClient(ApisApi);
  /** used to change the content-type of a PATCH request */
  const options = {
    headers: {
      "Content-Type": "application/merge-patch+json"
    }
  }

  /**
   * Function called to retrieve all CRDs in the cluster and all the custom resources associated with these CRDs
   * @returns a list of CRDs: {CRD, custom_resource}
   */
  const getCRDs = () => {
    return apiExt.listCustomResourceDefinition();
  }

  /**
   * Function called to retrieve all custom resource of a CRD in a namespace
   *
   * @param item is the CRD
   * @param namespace is the namespace of the CRD
   * @returns a list of the custom resources
   */
  const getCustomResources = (item, namespace) => {
    return apiCRD.listNamespacedCustomObject(
      item.spec.group,
      item.spec.version,
      namespace,
      item.spec.names.plural
    );
  }

  /**
   * Function called to retrieve all custom resource of a CRD in all namespaces
   *
   * @param item is the CRD
   * @returns a list of the custom resources
   */
  const getCustomResourcesAllNamespaces = item => {
    return apiCRD.listClusterCustomObject(
      item.spec.group,
      item.spec.version,
      item.spec.names.plural,
    );
  }

  /**
   *
   * @param group of the CR
   * @param version of the CR
   * @param namespace of the CR
   * @param plural of the CR
   * @param name of the CR
   * @returns a promise
   */
  const deleteCustomResource = (group, version, namespace, plural, name) => {
    if(namespace){
      return apiCRD.deleteNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        name,
        {}
      )
    } else {
      return apiCRD.deleteClusterCustomObject(
        group,
        version,
        plural,
        name,
        {}
      )
    }
  }

  /**
   * Function that create a new custom resource
   *
   * @param group of the CR
   * @param version of the CR
   * @param namespace of the custom resource
   * @param plural of the CR
   * @param item is the CR
   * @returns a promise
   */
  const createCustomResource = (group, version, namespace, plural, item) => {
    if(namespace !== '' && namespace){
      return apiCRD.createNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        item
      )
    } else {
      return apiCRD.createClusterCustomObject(
        group,
        version,
        plural,
        item
      )
    }
  }

  /**
   * Function that update a custom resource
   *
   * @param group of the CR
   * @param version of the CR
   * @param namespace of the custom resource
   * @param plural of the CR
   * @param name of the CR
   * @param item is the CR
   * @returns a promise
   */
  const updateCustomResource = (group, version, namespace, plural, name, item) => {
    if(namespace){
      return apiCRD.patchNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        name,
        item,
        options
      )
    } else {
      return apiCRD.patchClusterCustomObject(
        group,
        version,
        plural,
        name,
        item,
        options
      )
    }
  }

  /**
   * Function that update a CR
   *
   * @param name of the CR to update
   * @param item of the CR
   * @returns a promise
   */
  const updateCustomResourceDefinition = (name, item) => {
    return apiExt.patchCustomResourceDefinition(
      name,
      item,
      undefined,
      undefined,
      options
    )
  }

  /** This watch only watches changes in the CRDs
   * (if a CRD has been added, deleted or modified)
   */
  const watchFunction = (path, callback, done, signal, queryParams) => {
    return watch(
      config,
      path,
      queryParams,
      function(type, object) {
        callback(type, object);
      },
      done,
      signal
    );
  }

  /** gets all namespaces with label */
  const getNamespaces = label => {
    return apiCore.listNamespace(undefined, undefined, undefined, undefined, label)
  }

  /** gets all the pods with namespace (if specified) */
  const getPODsAllNamespaces = (fieldSelector) => {
    return apiCore.listPodForAllNamespaces(undefined, fieldSelector);
  }

  const getPODs = (namespace, fieldSelector) => {
    return apiCore.listNamespacedPod(namespace, undefined, undefined, undefined, fieldSelector);
  }

  /** gets the list of all the nodes in cluster */
  const getNodes = () => {
    return apiCore.listNode();
  }

  const fetchMetrics = path => {
    let headers = new Headers();
    headers.append("Authorization", "Bearer " + user.id_token);

    let requestOptions = {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    };

    return fetch(path, requestOptions).then(res => {
      if (res.ok) {
        return res.json();
      } else {
        return Promise.reject(res.status);
      }
    });
  }

  const getConfigMaps = (namespace, fieldSelector) => {
    return apiCore.listNamespacedConfigMap(namespace, undefined, undefined, undefined, fieldSelector);
  }

  const getApis = () => {
    return apiApis.getAPIVersions();
  }

  const fetchRaw = (path, method, item) => {
    let headers = new Headers();
    headers.append("Authorization", "Bearer " + user.id_token);
    if(method === 'PATCH')
      headers.append("Content-Type", "application/merge-patch+json");
    else if(method === 'POST')
      headers.append("Content-Type", "application/json");

    let requestOptions = {
      method: method,
      headers: headers,
      redirect: 'follow',
      body: JSON.stringify(item)
    };

    return fetch(path, requestOptions).then(res => {
      if (res.ok) {
        return res.json();
      } else {
        return Promise.reject(res.status);
      }
    });
  }

  const logFunction = (path) => {
    let headers = new Headers();
    headers.append("Authorization", "Bearer " + user.id_token);

    let requestOptions = {
      method: 'GET',
      headers: headers,
      redirect: 'follow'
    };

    return fetch(path, requestOptions)
      .then(res => {
        if (res.ok) {
          return res.text();
        } else {
          return Promise.reject(res.status);
        }
      });
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
    getNodes,
    fetchMetrics,
    getConfigMaps,
    getApis,
    fetchRaw,
    logFunction
  }

}
