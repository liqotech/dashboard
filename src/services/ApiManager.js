import { ApiextensionsV1beta1Api, Config, CoreV1Api, CustomObjectsApi, watch } from '@kubernetes/client-node';
import { APP_NAME, TEMPLATE_GROUP } from '../constants';
import { notification } from 'antd';

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
    this.CRDs = [];
    this.customViews = [];
    this.watchers = [];
    /** used to change the content-type of a PATCH request */
    this.options = {
      headers: {
        "Content-Type": "application/merge-patch+json"
      }
    }

    /** Callback for CRD list view */
    this.CRDListCallback = null;
    /** Callback for the autocomplete search bar */
    this.autoCompleteCallback = null;
    /** Callback array for CRDs in CRD view */
    this.CRDArrayCallback = [];
    /** Callback for the favourites CRDs in the sidebar */
    this.sidebarCallback = null;

    /** Callback array for custom views */
    this.CVArrayCallback = [];

    this.CRDsNotifyEvent = this.CRDsNotifyEvent.bind(this);
    this.CVsNotifyEvent = this.CVsNotifyEvent.bind(this);
  }

  refreshConfig(user){
    this.kcc = new Config(window.APISERVER_URL, user.id_token, user.token_type);
  }

  /**
   * Function called to retrieve all CRDs in the cluster and all the custom resources associated with these CRDs
   *
   * @returns a list of CRDs: {CRD, custom_resource}
   */
  getCRDs() {
    return this.apiExt.listCustomResourceDefinition()
    .then(res => {
      this.CRDs = res.body.items;
      /** update CRDs in the views */
      this.manageCallbackCRDs(this.CRDs);
    }).then(() => {
      this.watchAllCRDs();
    });
  }

  getCRDfromKind(kind) {
    return this.CRDs.find((item) => {
      return item.spec.names.kind === kind;
    });
  }

  getCRDfromName(name) {
    return this.CRDs.find((item) => {
      return item.metadata.name === name;
    });
  }

  /** Get the CRDs for the group crd-template.liqo.com */
  getTemplates() {
    let templates = [];
    this.CRDs.forEach(CRD => {
      if(CRD.spec.group === TEMPLATE_GROUP && CRD.spec.names.kind !== 'View'){
        templates.push(CRD.spec.names);
      }
    });
    return templates;
  }

  /** Load Custom Views CRs */
  loadCustomViewsCRs() {
    let CRD = {
      spec: {
        group: 'crd-template.liqo.com',
        version: 'v1',
        names: {
          plural: 'views'
        }
      }
    }
    /** First get all the CR */
    this.getCustomResourcesAllNamespaces(CRD)
      .then((res) => {
        this.customViews = res.body.items;

        /** update CVs in the views */
        this.manageCallbackCVs(this.customViews);

        /** Then set up a watch to watch changes in the CR of the CRD */
        this.watchSingleCRD(
          CRD.spec.group,
          CRD.spec.version,
          CRD.spec.names.plural,
          this.CVsNotifyEvent);
        }
      );
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
    if(namespace){
      return this.apiCRD.deleteNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        name,
        {}
      )
    } else {
      return this.apiCRD.deleteClusterCustomObject(
        group,
        version,
        plural,
        name,
        {}
      )
    }
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
    if(namespace !== '' && namespace){
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
    if(namespace){
      return this.apiCRD.patchNamespacedCustomObject(
        group,
        version,
        namespace,
        plural,
        name,
        item,
        this.options
      )
    } else {
      return this.apiCRD.patchClusterCustomObject(
        group,
        version,
        plural,
        name,
        item,
        this.options
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
  watchAllCRDs(){
    let path = '/apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions';

    let controller = new AbortController();
    let signal = controller.signal;

    this.watchers.push({
      controller: controller,
      plural: 'customresourcedefinitions'
    });

    let func = this.CRDsNotifyEvent;

    let _this = this;

    watch(
      this.kcc,
      path,
      {},
      function(type, object) {
        func(type, object);
      },
      function(type) {
        /** After 10 mins the watch stops */
        if(!type){
          _this.watchers = _this.watchers.filter(item => {return item.plural !== 'customresourcedefinitions'});
          _this.watchAllCRDs();
        }
      },
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

    this.triggerWatch(group, version, plural, controller, func);
    return controller;
  }

  /** is the param is true, also kill the CRDs watcher */
  abortAllWatchers(specificWatch) {
    if(specificWatch && specificWatch !== 'views' && specificWatch !== 'customresourcedefinitions') {
      let w = this.watchers.find(item => {return item.plural === specificWatch});
      /** Here if the watcher has already been aborted (because we wanted to), don't restart it */
      if(!w)
        return false;
      /** else, abort it and it will be restarted */
      w.controller.abort();
      this.watchers = this.watchers.filter(item => {return item.plural !== specificWatch});
      return true;
    }

    let watchers = this.watchers;

    this.watchers.forEach((watcher) => {
      /** Don't kill the custom view watcher nor the CRD watcher */
      if(watcher.plural !== 'views'){
        if(watcher.plural !== 'customresourcedefinitions'){
          watchers = watchers.filter(item => {return item !== watcher});
          watcher.controller.abort();
        }
      }
    });

    this.watchers = watchers;
    return true;
  }

  /**
   * @UNUSED_SINCE_HTTP2 Scheduler Round Robin for the watchers:
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

    let _this = this;

    watch(
      this.kcc,
      path,
      {},
      function(type, object) {
        func(type, object);
      },
      function(type) {
        /** After 10 mins the watch stops */
        if(!type){
          if(_this.abortAllWatchers(plural)){
            /**
             * If it's the views watcher that stopped, we need to do an extra step
             */
            if(plural === 'views'){
              _this.watchers = _this.watchers.filter(item => {return item.plural !== plural});
            }
            _this.watchSingleCRD(group, version, plural, func);
          }
        }
      },
      signal
    );
  }

  /**
   * Callback used by the CRDs watcher trigger (if the CRD is changed)
   * @param type: description of the trigger (modify/add/delete)
   * @param object: object modified/added/deleted
   */
  CRDsNotifyEvent(type, object) {

    /**
     * When the watcher starts it returns the state of the k8s system,
     *  so every CRD that's in the system will be returned with type: ADDED
     *  To avoid the computational overhead of that, filter out the CRD that
     *  are in fact not changed (field resourceVersion)
     */
    if(type === 'ADDED' && this.CRDs.find((item) => {
      return item.metadata.name === object.metadata.name;
    }).metadata.resourceVersion === object.metadata.resourceVersion){
      return;
    }

    /** This deepcopy is the thread killer */
    let CRDs = JSON.parse(JSON.stringify(this.CRDs));

    let index = CRDs.indexOf(CRDs.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(index !== -1) {
        if(CRDs[index].metadata.resourceVersion !== object.metadata.resourceVersion){
          CRDs[index] = object;
          notification.success({
            message: APP_NAME,
            description: 'CRD ' + object.metadata.name + ' modified'
          });
        }
      } else {
        CRDs.push(object);
        CRDs.sort((a, b) => a.spec.names.kind.localeCompare(b.spec.names.kind));
        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' added'
        });
      }
    } else if (type === 'DELETED') {
      if(index !== -1) {
        CRDs.splice(index, 1);

        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' deleted'
        });
      } else {
        return;
      }
    }

    if(JSON.stringify(this.CRDs) !== JSON.stringify(CRDs)){
      this.CRDs = CRDs;
      /** update CRDs in the views */
      this.manageCallbackCRDs(CRDs, object, type);
    }
  }

  manageCallbackCRDs(CRDs, object, type){
    /** update CRDs in the search bar */
    if(this.autoCompleteCallback)
      this.autoCompleteCallback(CRDs);

    /** update CRDs in the CRD view*/
    if(this.CRDListCallback)
      this.CRDListCallback(CRDs);

    /** update CRDs in the CRD views */
    this.CRDArrayCallback.forEach(func => {
      func(CRDs, object, type);
    })

    /** update CRDs in the sidebar */
    if(this.sidebarCallback)
      this.sidebarCallback(CRDs.filter(item => {
        return item.metadata.annotations && item.metadata.annotations.favourite;
      }));
  }

  CVsNotifyEvent(type, object) {
    let customViews = JSON.parse(JSON.stringify(this.customViews));

    let index = customViews.indexOf(customViews.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(index !== -1) {
        if(customViews[index].metadata.resourceVersion !== object.metadata.resourceVersion){
          customViews[index] = object;
          notification.success({
            message: APP_NAME,
            description: 'CR ' + object.metadata.name + ' modified'
          });
        }
      } else {
        customViews.push(object);
        customViews.sort((a, b) => a.kind.localeCompare(b.kind));
        notification.success({
          message: APP_NAME,
          description: 'CR ' + object.metadata.name + ' added'
        });
      }
    } else if (type === 'DELETED') {
      if(index !== -1) {
        customViews.splice(index, 1);

        notification.success({
          message: APP_NAME,
          description: 'CR ' + object.metadata.name + ' deleted'
        });
      } else {
        return;
      }
    }

    if(JSON.stringify(this.customViews) !== JSON.stringify(customViews)){
      this.customViews = customViews;
      /** update customViews in the views */
      this.manageCallbackCVs(customViews);
    }
  }

  manageCallbackCVs(customViews){
    /** update custom views */
    this.CVArrayCallback.forEach(func => {
      func(customViews);
    })
  }

  /** gets all namespaces with label */
  getNamespaces(label){
    return this.apiCore.listNamespace(null, null, null, null, label)
  }

  /** gets all the pods with namespace (if specified) */
  getPODs(namespace){
    return this.apiCore.listPodForAllNamespaces(null, namespace ? 'metadata.namespace=' + namespace : null);
  }

}
