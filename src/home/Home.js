import React, { Component } from 'react';
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

class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      config: {},
      foreignClusters: [],
      advertisements: [],
      peeringRequests: [],
      layouts: {},
      homeNodes: [],
      foreignNodes: [],
      fcMetricsIn: [],
      fcMetricsOut: []
    }

    this.updateFCMetrics = this.updateFCMetrics.bind(this);
    this.CRConfigNotifyEvent = this.CRConfigNotifyEvent.bind(this);
    this.CRForeignClusterNotifyEvent = this.CRForeignClusterNotifyEvent.bind(this);
    this.CRAdvertisementNotifyEvent = this.CRAdvertisementNotifyEvent.bind(this);
    this.CRPeeringRequestNotifyEvent = this.CRPeeringRequestNotifyEvent.bind(this);
    this.loadCRD = this.loadCRD.bind(this);
    this.CRDCallback = this.CRDCallback.bind(this);
  }

  updateFCMetrics(incoming, update){
    if(incoming){
      let fcMetricsIn = this.state.fcMetricsIn.filter(metric => {return metric.fc !== update.fc});
      fcMetricsIn.push(update);
      this.setState({fcMetricsIn: fcMetricsIn});
    } else {
      let fcMetricsOut = this.state.fcMetricsOut.filter(metric => {return metric.fc !== update.fc});
      fcMetricsOut.push(update);
      this.setState({fcMetricsOut: fcMetricsOut});
    }
  }

  componentDidMount() {
    this.props.api.CRDArrayCallback.push(this.CRDCallback);
    this.loadCRD('ForeignCluster');
    this.loadCRD('Advertisement');
    this.loadCRD('PeeringRequest');
    this.loadCRD('ClusterConfig');
    this.props.api.getNodes()
      .then(res => {
        let nodes = res.body.items;
        this.setState({
          nodes: nodes,
          homeNodes: nodes.filter(no => {return no.metadata.labels.type !== 'virtual-node'}),
          foreignNodes: nodes.filter(no => {return no.metadata.labels.type === 'virtual-node'}),
          loading: false
        })
      })
      .catch(error => {
        console.log(error);
      })
  }

  CRDCallback(CRDs){
    CRDs.forEach(item => {
      if(item.spec.names.kind === 'ForeignCluster' ||
        item.spec.names.kind === 'Advertisement' ||
        item.spec.names.kind === 'ClusterConfig' ||
        item.spec.names.kind === 'PeeringRequest'){
        this.loadCRD(item.spec.names.kind);
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
  loadCRD(kind) {
    let CRD;

    CRD = this.props.api.getCRDfromKind(kind);

    if(CRD){
      this.props.api.getCustomResourcesAllNamespaces(CRD).then( res => {
        let notifyEvent = null;
        if(kind === 'ForeignCluster') {
          notifyEvent = this.CRForeignClusterNotifyEvent;
          this.setState({
            foreignClusters: res.body.items
          })
        } else if(kind === 'Advertisement') {
          notifyEvent = this.CRAdvertisementNotifyEvent;
          this.setState({
            advertisements: res.body.items
          })
        } else if(kind === 'PeeringRequest') {
          notifyEvent = this.CRPeeringRequestNotifyEvent;
          this.setState({
            peeringRequests: res.body.items
          })
        } else if(kind === 'ClusterConfig') {
          notifyEvent = this.CRConfigNotifyEvent;
          this.setState({
            config: res.body.items[0]
          })
        }

        /** Then set up a watch to watch changes of the config */
        this.props.api.watchSingleCRD(
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

  checkModifies(type, object, cr) {
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
  CRPeeringRequestNotifyEvent(type, object) {
    let cr = this.state.peeringRequests;
    cr = this.checkModifies(type, object, cr);
    this.setState({
      peeringRequests: cr
    })
  }

  /**
   * The function is triggered when the watcher detects an
   * advertisement update and updates it in the component state
   * @type: can be ADDED, MODIFIED or DELETED
   * @object: the item updated
   */
  CRAdvertisementNotifyEvent(type, object) {
    let cr = this.state.advertisements;
    cr = this.checkModifies(type, object, cr);
    this.setState({
      advertisements: cr
    })
  }

  /**
   * The function is triggered when the watcher detects a
   * foreign cluster update and updates it in the component state
   * @type: can be ADDED, MODIFIED or DELETED
   * @object: the item updated
   */
  CRForeignClusterNotifyEvent(type, object) {
    let cr = this.state.foreignClusters;
    cr = this.checkModifies(type, object, cr);
    this.setState({
      foreignClusters: cr
    })
  }

  /**
   * The function is triggered when the watcher detects a
   * cluster config update and updates it in the component state
   * @type: can be ADDED, MODIFIED or DELETED
   * @object: the item updated
   */
  CRConfigNotifyEvent(type, object) {
    let cr = [];
    cr.push(this.state.config);
    cr = this.checkModifies(type, object, cr);
    this.setState({
      config: cr[0]
    })
  }

  /**
   * Delete any reference to the component in the api service.
   * Avoid no-op and memory leaks
   */
  componentWillUnmount() {
    this.props.api.abortAllWatchers('foreignclusters');
    this.props.api.abortAllWatchers('clusterconfigs');
    this.props.api.abortAllWatchers('advertisements');
    this.props.api.abortAllWatchers('peeringrequests');
    this.props.api.CRDArrayCallback = this.props.api.CRDArrayCallback.filter(func => {return func !== this.loadCRD});
  }

  render() {
    /**
     * These are the three main component of the view, along with the header:
     * the list of connected peers
     * the list of available peers
     * the general status of the clusters
     */
    let cards = ([
      <div key={'list_connected'} data-grid={{ w: 2, h: 10, x: 0, y: 0, minW: 2, minH: 3 }} >
        <div className={'scrollbar'} >
          <Alert.ErrorBoundary>
            <ListConnected api={this.props.api} config={this.state.config}
                           foreignClusters={this.state.foreignClusters.filter(fc =>
                             {return ( fc.spec.join && fc.status && (fc.status.outgoing.joined || fc.status.incoming.joined))}
                           )}
                           advertisements={this.state.advertisements}
                           peeringRequests={this.state.peeringRequests}
                           homeNodes={this.state.homeNodes}
                           foreignNodes={this.state.foreignNodes}
                           updateFCMetrics={this.updateFCMetrics}
            />
          </Alert.ErrorBoundary>
        </div>
      </div>,
      <div key={'list_available'} data-grid={{ w: 2, h: 10, x: 2, y: 0, minW: 2, minH: 3 }} >
        <div className={'scrollbar'} >
          <Alert.ErrorBoundary>
            <ListAvailable api={this.props.api} config={this.state.config}
                           foreignClusters={this.state.foreignClusters}
                           advertisements={this.state.advertisements}
                           peeringRequests={this.state.peeringRequests}
            />
          </Alert.ErrorBoundary>
        </div>
      </div>,
      <div data-grid={{ w: 2, h: 10, x: 4, y: 0, minW: 2, minH: 3 }} key={'status'} >
        <div className={'scrollbar'} >
          <Alert.ErrorBoundary>
            <Status api={this.props.api} config={this.state.config} foreignClusters={this.state.foreignClusters}
                    homeNodes={this.state.homeNodes}
                    foreignNodes={this.state.foreignNodes}
                    incomingMetrics={this.state.fcMetricsIn}
                    outgoingMetrics={this.state.fcMetricsOut}
            />
          </Alert.ErrorBoundary>
        </div>
      </div>
    ])

    //TODO: support save function for layout

    return (
      <div>
        { this.state.loading ? (
          <LoadingIndicator />
        ) : (
          <div>
            <div className="home-container">
              <LiqoHeader api={this.props.api} config={this.state.config} />
              { resizeDetector() }
              <ResponsiveGridLayout className="react-grid-layout" layouts={this.state.layouts} margin={[20, 20]}
                                    breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                                    cols={{lg: 6, md: 3, sm: 2, xs: 1, xxs: 1}}
                                    compactType={'horizontal'} rowHeight={50}
                                    draggableHandle={'.draggable'}
                                    onLayoutChange={(layout, layouts) => { this.setState({layouts: layouts})} }
              >
                {cards}
              </ResponsiveGridLayout>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Home);
