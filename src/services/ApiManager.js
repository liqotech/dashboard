import { ApiextensionsV1beta1Api, Config, CoreV1Api, CustomObjectsApi, watch } from '@kubernetes/client-node';
import { API_BASE_URL, TEMPLATE_GROUP } from '../constants';
import Authenticator from './Authenticator';

/**
 * Class to manage all the interaction with the cluster
 *
 */

export default class ApiManager {

  /**
   * Constructor
   *
   *
   */
  constructor(user) {
    if (window.APISERVER_URL === undefined) {
      window.APISERVER_URL = APISERVER_URL;
    }
    this.kcc = new Config(window.APISERVER_URL, user.id_token, user.token_type);
    this.apiExt = this.kcc.makeApiClient(ApiextensionsV1beta1Api);
    this.apiCRD = this.kcc.makeApiClient(CustomObjectsApi);
    this.apiCore = this.kcc.makeApiClient(CoreV1Api);
    this.watchers = [];
    /** used to change the content-type of a PATCH request */
    this.options = {
      headers: {
        "Content-Type": "application/merge-patch+json"
      }
    }
    this.autoCompleteCallback = null;
  }

  /**
   * Function called to retrieve all CRDs in the cluster and all the custom resources associated with these CRDs
   *
   * @returns a list of CRDs: {CRD, custom_resource}
   */
  async getCRDs() {
    let response_crd = await this.apiExt.listCustomResourceDefinition();
    let results_crd = await response_crd.body;

    this.autoCompleteCallback(results_crd.items);

    return results_crd.items;
  }

  async getCRDfromKind(kind) {
    let response_crd = await this.apiExt.listCustomResourceDefinition();

    return response_crd.body.items.find((item) => {
      return item.spec.names.kind === kind;
    });
  }

  async getCRDfromName(name) {
    let response_crd = await this.apiExt.listCustomResourceDefinition();
    return response_crd.body.items.find((item) => {
      return item.metadata.name === name;
    });
  }

  /** get the CRDs for the group crd-template.liqo.com */
  getTemplates() {
    return fetch(
      API_BASE_URL +
      '/apis/' +
      TEMPLATE_GROUP
    ).then(item => item.json())
     .then(data => {
       return data.resources.filter(item => {
           return item.singularName !== '';
         }
       );
     });
  }

  /**
   * Function called to retrieve all custom resource of a CRD in a namespace
   *
   * @param item is the CRD
   * @returns a list of the custom resources
   */
  getCustomResources(item) {
    return this.apiCRD.listNamespacedCustomObject(
      item.spec.group,
      item.spec.version,
      'default',
      item.spec.names.plural
    );
  }

  /**
   * Function called to retrieve all custom resource of a CRD in all namespaces
   *
   * @param item is the CRD
   * @returns a list of the custom resources
   */
  getCustomResourcesAllNamespaces(item) {
    return this.apiCRD.listClusterCustomObject(
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
  deleteCustomResource(group, version, namespace, plural, name) {
    return this.apiCRD.deleteNamespacedCustomObject(
      group,
      version,
      namespace,
      plural,
      name,
      {}
    )
  }

  /**
   * Function called to delete a CRD
   * @UNUSED for now
   *
   * @param CRD_name
   */
  deleteCRD(CRD_name) {
    return this.apiExt.deleteCustomResourceDefinition(CRD_name);
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
  createCustomResource(group, version, namespace, plural, item) {
    if(namespace !== ''){
      return this.apiCRD.createNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        item
      )
    } else {
      return this.apiCRD.createClusterCustomObject(
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
  updateCustomResource(group, version, namespace, plural, name, item){
    return this.apiCRD.patchNamespacedCustomObject(
      group,
      version,
      namespace,
      plural,
      name,
      item,
      this.options
    )
  }

  /**
   * Function that update a CR
   *
   * @param name of the CR to update
   * @param item of the CR
   * @returns a promise
   */
  updateCustomResourceDefinition(name, item){
    return this.apiExt.patchCustomResourceDefinition(
      name,
      item,
      undefined,
      undefined,
      this.options
    )
  }

  /** This watch only watches changes in the CRDs
   * (if a CRD has been added, deleted or modified)
   */
  watchAllCRDs(func){
    let path = '/apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions';

    let controller = new AbortController();
    let signal = controller.signal;

    this.watchers.push({
      controller: controller,
      plural: 'customresourcedefinitions'
    });

    watch(
      this.kcc,
      path,
      {},
      function(type, object) {
        func(type, object);
      },
      function(error) {},
      signal
    );
  }

  /**
   * This watch report changes of the CRs in a CRD
   */
  watchSingleCRD(group, version, plural, func){
    /** We don't want two of the same watcher */
    if(this.watchers.find(item => {return item.plural === plural})){
      return;
    }

    let controller = new AbortController();

    this.watchers.push({
      controller: controller,
      group: group,
      version: version,
      plural: plural,
      callback: func
    });
  }

  /** is the param is true, also kill the CRDs watcher */
  abortAllWatchers(deleteAlsoCRDsWatcher, specificWatch) {
    if(specificWatch && specificWatch !== 'views') {
      this.watchers.find(item => {return item.plural === specificWatch}).controller.abort();
      this.watchers = this.watchers.filter(item => {return item.plural !== specificWatch});
      return;
    }

    let watchers = this.watchers;

    this.watchers.forEach((watcher) => {
      /** Don't kill the custom view watcher nor the CRD watcher */
      if(watcher.plural !== 'views'){
        if(watcher.plural !== 'customresourcedefinitions'){
          watchers = watchers.filter(item => {return item !== watcher});
          watcher.controller.abort();
        } else if(deleteAlsoCRDsWatcher) {
          watchers = watchers.filter(item => {return item !== watcher});
          watcher.controller.abort();
        }
      }
    });

    this.watchers = watchers;
  }

  /** Scheduler Round Robin for the watchers:
   * every 1 second open a watch for a single CRD to check for changes,
   * then close it and proceed to another watch
   */
  watcherSchedulerRR(){
    let i = 0;
    let timeout = 1000;

    setInterval(() => {
      if(this.watchers[i]){

        if(this.watchers[i].plural !== 'customresourcedefinitions') {
          let controller = new AbortController();
          this.watchers[i].controller = controller;
          this.triggerWatch(
            this.watchers[i].group,
            this.watchers[i].version,
            this.watchers[i].plural,
            controller,
            this.watchers[i].callback
          )
        }
        if(i === 0){
          if(this.watchers[this.watchers.length-1].plural !== 'customresourcedefinitions')
            this.watchers[this.watchers.length-1].controller.abort();
        } else {
          if(this.watchers[i-1].plural !== 'customresourcedefinitions')
            this.watchers[i-1].controller.abort();
        }
        if(i === this.watchers.length-1){
          i = 0;
        } else {
          ++i;
        }
      } else {
        i = 0;
      }
    }, timeout);
  }

  triggerWatch(group, version, plural, controller, func){
    let path = '/apis/' +
      group + '/' +
      version + '/' +
      plural;

    let signal = controller.signal;

    watch(
      this.kcc,
      path,
      {},
      function(type, object) {
        func(type, object);
      },
      function() {},
      signal
    );
  }
}
