import { APP_NAME, TEMPLATE_GROUP } from '../../constants';
import { notification } from 'antd';
import { forEach } from 'react-bootstrap/cjs/ElementChildren';

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
    this.user = user;
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

    this.manageCallbackCRDs = this.manageCallbackCRDs.bind(this);
    this.manageCallbackCVs = this.manageCallbackCVs.bind(this);
    this.updateCustomResource = this.updateCustomResource.bind(this);
    this.updateCustomResourceDefinition = this.updateCustomResourceDefinition.bind(this);

    this.CRDsNotifyEvent = this.CRDsNotifyEvent.bind(this);
    this.CVsNotifyEvent = this.CVsNotifyEvent.bind(this);
  }

  refreshConfig(user){
  }

  /**
   * Function called to retrieve all CRDs in the cluster and all the custom resources associated with these CRDs
   *
   * @returns a list of CRDs: {CRD, custom_resource}
   */
  getCRDs() {
    return fetch('http://localhost:3001/customresourcedefinition')
      .then(res => res.json())
      .then(res => {
        this.CRDs = res.items;
        this.manageCallbackCRDs(this.CRDs);
      })
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

  /** Get the CRDs for the group dashboard.liqo.com */
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
  async loadCustomViewsCRs() {
    let CRD = this.getCRDfromKind('View');

    if(CRD){
      /** First get all the CR */
      await this.getCustomResourcesAllNamespaces(CRD)
        .then((res) => {
            this.customViews = res.body.items;

            /** update CVs in the views */
            this.manageCallbackCVs(this.customViews);
          }
        )
    }
  }

  /**
   * Function called to retrieve all custom resource of a CRD in all namespaces
   *
   * @param item is the CRD
   * @returns a list of the custom resources
   */
  getCustomResourcesAllNamespaces(item) {
    return fetch('http://localhost:3001/clustercustomobject/' + item.spec.names.plural)
      .then(res => res.json());
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
    return fetch('http://localhost:3001/clustercustomobject/' + plural, { method: 'DELETE'})
      .then(res => res.json())
      .then((res) => {
      if(plural === 'views'){
        this.customViews = this.customViews.filter(item => {
          return item.metadata.name !== name
        });
        this.manageCallbackCVs(this.customViews);
      }

      this.watchers.forEach(w => {
        if (w.plural === plural)
          w.callback('DELETED', res);
      })
    })
  }

  /**
   * Function called to delete a CRD
   * @UNUSED for now
   *
   * @param CRD_name
   */
  deleteCRD(CRD_name) {
    return Promise.resolve();
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
    return fetch('http://localhost:3001/clustercustomobject/' + plural, { method: 'POST', body: item})
      .then(res => res.json())
      .then((res) => {
        if(plural === 'views'){
          this.customViews=res.body.items;
          this.manageCallbackCVs(res.body.items);
        }
        this.watchers.forEach(w => {
          if (w.plural === plural)
            w.callback('ADDED', res.body);
        })
      });
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
    if (plural === 'liqodashtests' ||
      plural === 'clusterconfigs' ||
      plural === 'foreignclusters' ||
      plural === 'searchdomains' ||
      plural === 'advertisements' ||
      plural === 'views'
    ) {
      return fetch('http://localhost:3001/clustercustomobject/' + plural, { method: 'PUT', body: item})
        .then(res => res.json())
        .then((res) => {
          if(plural === 'views') {
            let itemDC = JSON.parse(JSON.stringify(item));
            itemDC.metadata.resourceVersion++;
            this.CVsNotifyEvent('MODIFIED', itemDC);
            return Promise.resolve(new Response(JSON.stringify(item)))
          }
          this.watchers.forEach(w => {
            if (w.plural === plural)
              w.callback('MODIFIED', res.body);
          })
          return res;
        });
    } else {
      return Promise.resolve(item)
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
    let itemDC = JSON.parse(JSON.stringify(item));
    itemDC.metadata.resourceVersion++;
    this.CRDsNotifyEvent('MODIFIED', itemDC);
    return Promise.resolve();
  }

  /**
   * This watch report changes of the CRs in a CRD
   */
  watchSingleCRD(group, version, plural, func){

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
  abortAllWatchers(specificWatch) {
    if(specificWatch && specificWatch !== 'views' && specificWatch !== 'customresourcedefinitions') {
      let w = this.watchers.find(item => {return item.plural === specificWatch});
      /** Here if the watcher has already been aborted (because we wanted to), don't restart it */
      if(!w)
        return false;
      /** else, abort it and it will be restarted */
      //w.controller.abort();
      this.watchers = this.watchers.filter(item => {return item.plural !== specificWatch});
      return true;
    }

    let watchers = this.watchers;

    this.watchers.forEach((watcher) => {
      /** Don't kill the custom view watcher nor the CRD watcher */
      if(watcher.plural !== 'views'){
        if(watcher.plural !== 'customresourcedefinitions'){
          watchers = watchers.filter(item => {return item !== watcher});
          //watcher.controller.abort();
        }
      }
    });

    this.watchers = watchers;
    return true;
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
    if(this.sidebarCallback){
      this.sidebarCallback(CRDs.filter(item => {
        return item.metadata.annotations && item.metadata.annotations.favourite;
      }));
    }
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

  getNamespaces(label){
    return Promise.resolve({body: { items: [{ metadata: { name: 'test' }}]}});
  }

  /** gets all the pods */
  getPODs(namespace){
    return fetch('http://localhost:3001/pod').then(res => res.json());
  }

  getNodes(){
    return fetch('http://localhost:3001/nodes').then(res => res.json());
  }

  getMetricsPOD(namespace, name){
    return fetch('http://localhost:3001/metrics/pods/' + name).then(res => res.json());
  }

  getMetricsNodes(){
    return fetch('http://localhost:3001/metrics/nodes').then(res => res.json());
  }

  getConfigMaps(namespace){
    return fetch('http://localhost:3001/configmaps/' + namespace).then(res => res.json());
  }

}
