import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import './Home.css';
import { Alert } from 'antd';
import LiqoHeader from './LiqoHeader';
import ListConnected from './ListConnected';
import ListAvailable from './ListAvailable';
import Status from './Status';
import LoadingIndicator from '../common/LoadingIndicator';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { resizeDetector } from '../views/CustomViewUtils';

const ResponsiveGridLayout = WidthProvider(Responsive);

function Home(props){
  
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState([]);
  const [foreignClusters, setForeignClusters] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [peeringRequests, setPeeringRequests] = useState([]);
  const [layouts, setLayouts] = useState();
  const [homeNodes, setHomeNodes] = useState([]);
  const [foreignNodes, setForeignNodes] = useState([]);
  const [fcMetricsIn, setFcMetricsIn] = useState([]);
  const [fcMetricsOut, setFcMetricsOut] = useState([]);

  useEffect(() => {
    props.api.CRDArrayCallback.push(CRDCallback);
    loadCRD('ForeignCluster');
    loadCRD('Advertisement');
    loadCRD('PeeringRequest');
    loadCRD('ClusterConfig');
    props.api.getNodes()
      .then(res => {
        let nodes = res.body.items;
        setHomeNodes(nodes.filter(no => {return no.metadata.labels.type !== 'virtual-node'}));
        setForeignNodes(nodes.filter(no => {return no.metadata.labels.type === 'virtual-node'}));
        setLoading(false);
      })
      .catch(error => {
        console.log(error);
      })

    /**
     * Delete any reference to the component in the api service.
     * Avoid no-op and memory leaks
     */
    return () => {
      props.api.abortAllWatchers('foreignclusters');
      props.api.abortAllWatchers('clusterconfigs');
      props.api.abortAllWatchers('advertisements');
      props.api.abortAllWatchers('peeringrequests');
      props.api.CRDArrayCallback = props.api.CRDArrayCallback.filter(func => {return func !== CRDCallback});
    }
  }, []);

  const updateFCMetrics = (incoming, update) => {
    if(incoming){
      setFcMetricsIn(prev => {
        prev = prev.filter(metric => {return metric.fc !== update.fc});
        prev.push(update);
        return prev;
      });
    } else {
      setFcMetricsOut(prev => {
        prev = prev.filter(metric => {return metric.fc !== update.fc});
        prev.push(update);
        return prev;
      });
    }
  }

  const CRDCallback = CRDs => {
    CRDs.forEach(item => {
      if(item.spec.names.kind === 'ForeignCluster' ||
        item.spec.names.kind === 'Advertisement' ||
        item.spec.names.kind === 'ClusterConfig' ||
        item.spec.names.kind === 'PeeringRequest'){
        loadCRD(item.spec.names.kind);
      }
    });
  }

  /**
   * This function is called once the component did mount and every time
   * a CRD gets an update. It loads the resources of the CRD and set up
   * a watch for it
   * @CRDs: the list of updated CRD (only used when a CRD gets an update)
   * @kind: the kind of the questioned CRD
   */
  const loadCRD = kind => {
    let CRD;

    CRD = props.api.getCRDfromKind(kind);

    if(CRD){
      props.api.getCustomResourcesAllNamespaces(CRD).then( res => {
        let notifyEvent = null;
        if(kind === 'ForeignCluster') {
          notifyEvent = CRForeignClusterNotifyEvent;
          setForeignClusters(res.body.items);
        } else if(kind === 'Advertisement') {
          notifyEvent = CRAdvertisementNotifyEvent;
          setAdvertisements(res.body.items);
        } else if(kind === 'PeeringRequest') {
          notifyEvent = CRPeeringRequestNotifyEvent;
          setPeeringRequests(res.body.items);
        } else if(kind === 'ClusterConfig') {
          notifyEvent = CRConfigNotifyEvent;
          setConfig(res.body.items);
        }

        /** Then set up a watch to watch changes of the config */
        props.api.watchSingleCRD(
          CRD.spec.group,
          CRD.spec.version,
          CRD.spec.names.plural,
          notifyEvent
        );

      }).catch(error => {
        console.log(error);
      })
    }
  }

  const checkModifies = (type, object, prev) => {
    let cr = JSON.parse(JSON.stringify(prev));

    let index = cr.indexOf(cr.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(index !== -1) {
        if(JSON.stringify(cr[index]) !== JSON.stringify(object)){
          cr[index] = object;
        }
      } else {
        cr.push(object);
      }
    } else if (type === 'DELETED') {
      if(index !== -1) {
        cr.splice(index, 1);
      }
    }

    return cr;
  }

  /**
   * The function is triggered when the watcher detects a
   * peering request update and updates it in the component state
   * @type: can be ADDED, MODIFIED or DELETED
   * @object: the item updated
   */
  const CRPeeringRequestNotifyEvent = (type, object) => {
    setPeeringRequests(prev => checkModifies(type, object, prev));
  }

  /**
   * The function is triggered when the watcher detects an
   * advertisement update and updates it in the component state
   * @type: can be ADDED, MODIFIED or DELETED
   * @object: the item updated
   */
  const CRAdvertisementNotifyEvent = (type, object) => {
    setAdvertisements(prev => checkModifies(type, object, prev));
  }

  /**
   * The function is triggered when the watcher detects a
   * foreign cluster update and updates it in the component state
   * @type: can be ADDED, MODIFIED or DELETED
   * @object: the item updated
   */
  const CRForeignClusterNotifyEvent = (type, object) => {
    setForeignClusters(prev => checkModifies(type, object, prev));
  }

  /**
   * The function is triggered when the watcher detects a
   * cluster config update and updates it in the component state
   * @type: can be ADDED, MODIFIED or DELETED
   * @object: the item updated
   */
  const CRConfigNotifyEvent = (type, object) => {
    setConfig(prev => checkModifies(type, object, prev));
  }

  /**
   * These are the three main component of the view, along with the header:
   * the list of connected peers
   * the list of available peers
   * the general status of the clusters
   */
  return(
    <div>
      { loading || config.length === 0 ? (
        <LoadingIndicator />
      ) : (
        <div>
          <div className="home-container">
            <LiqoHeader api={props.api} config={config[0]} />
            { resizeDetector() }
            <ResponsiveGridLayout className="react-grid-layout" layouts={layouts} margin={[20, 20]}
                                  breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                                  cols={{lg: 6, md: 3, sm: 2, xs: 1, xxs: 1}}
                                  compactType={'horizontal'} rowHeight={50}
                                  draggableHandle={'.draggable'}
                                  onLayoutChange={(layout, layouts) => { setLayouts(layouts)} }
            >
              <div key={'list_connected'} data-grid={{ w: 2, h: 10, x: 0, y: 0, minW: 2, minH: 3 }} >
                <div className={'scrollbar'} >
                  <Alert.ErrorBoundary>
                    <ListConnected api={props.api} config={config[0]}
                                   foreignClusters={foreignClusters.filter(fc =>
                                     {return ( fc.spec.join && fc.status && (fc.status.outgoing.joined || fc.status.incoming.joined))}
                                   )}
                                   advertisements={advertisements}
                                   peeringRequests={peeringRequests}
                                   homeNodes={homeNodes}
                                   foreignNodes={foreignNodes}
                                   updateFCMetrics={updateFCMetrics}
                    />
                  </Alert.ErrorBoundary>
                </div>
              </div>
              <div key={'list_available'} data-grid={{ w: 2, h: 10, x: 2, y: 0, minW: 2, minH: 3 }} >
                <div className={'scrollbar'} >
                  <Alert.ErrorBoundary>
                    <ListAvailable api={props.api} config={config[0]}
                                   foreignClusters={foreignClusters}
                                   advertisements={advertisements}
                                   peeringRequests={peeringRequests}
                    />
                  </Alert.ErrorBoundary>
                </div>
              </div>
              <div data-grid={{ w: 2, h: 10, x: 4, y: 0, minW: 2, minH: 3 }} key={'status'} >
                <div className={'scrollbar'} >
                  <Alert.ErrorBoundary>
                    <Status api={props.api} config={config[0]} foreignClusters={foreignClusters}
                            homeNodes={homeNodes}
                            foreignNodes={foreignNodes}
                            incomingMetrics={fcMetricsIn}
                            outgoingMetrics={fcMetricsOut}
                    />
                  </Alert.ErrorBoundary>
                </div>
              </div>
            </ResponsiveGridLayout>
          </div>
        </div>
      )}
    </div>
  );
}

export default withRouter(Home);
