import React, { Component } from 'react';
import { Badge, Breadcrumb, notification, Tabs, Typography } from 'antd';
import LoadingIndicator from '../common/LoadingIndicator';
import { Link, withRouter } from 'react-router-dom';
import './CRDList.css';
import './CRD.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-resizable/css/styles.css';
const ResponsiveGridLayout = WidthProvider(Responsive);
const { Title } = Typography;
import { APP_NAME } from '../constants';

class CRDList extends Component {
  constructor(props) {
    super(props);
    /**
     * @param: isLoading: boolean
     * @param: CRDs: array of CRDs
     */
    this.state = {
      CRDs: [],
      isLoading: false,
      layout: {lg: []},
    };
    this.loadCustomResourceDefinitions = this.loadCustomResourceDefinitions.bind(this);
    this.api = this.props.api;
    this.notifyEvent = this.notifyEvent.bind(this);
  }

  loadCustomResourceDefinitions() {
    /** Abort all watchers to prevent pending connections */
    this.api.abortAllWatchers(true);

    let promise = this.api.getCRDs();

    if (!promise) {
      return;
    }

    this.setState({
      isLoading: true
    });

    promise
      .then(response => {
        /** Once we have all CRDs, let's watch for changes */
        this.api.watchAllCRDs(this.notifyEvent);

        this.setState({
          CRDs: response,
          isLoading: false
        });

        this.generateLayout();
      })
      .catch(() => {
        this.setState({
          isLoading: false
        });
      })
  }

  componentDidMount() {
    this.loadCustomResourceDefinitions();
  }

  generateLayout(){
    let layout = [];

    for(let i = 0; i < this.state.CRDs.length; i++) {
      layout.push({
        i: this.state.CRDs[i].metadata.name, x: i%2, y: Math.floor(i/2), w: 1, h: 1, static: true
      });
    }
    this.setState({
      layout: {lg: layout}
    });
  }

  /**
   * Callback for CRDs watcher trigger (if the CRD is changed)
   * @param type: description of the trigger (modify/add/delete)
   * @param object: object modified/added/deleted
   */
  notifyEvent(type, object) {

    let CRDs = this.state.CRDs;

    let index = CRDs.indexOf(CRDs.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(index !== -1) {
        CRDs[index] = object;

        /*notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' modified'
        });*/
      } else {
        CRDs.push(object);

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

    this.setState({
      CRDs: CRDs
    });

    this.props.api.autoCompleteCallback(CRDs);
  }

  render() {
    const CRDViews = [];
    this.state.CRDs.forEach(CRD => {
      CRDViews.push(
        <div className="crd-content" key={CRD.metadata.name}>
          <div>
            <div className="crd-header">
              <div>
                <Breadcrumb separator={'>'}>
                  <Breadcrumb.Item>API</Breadcrumb.Item>
                  <Breadcrumb.Item>CRD</Breadcrumb.Item>
                  <Breadcrumb.Item>{CRD.metadata.name}</Breadcrumb.Item>
                </Breadcrumb>
                <br />
                <div>
                  {/** 
                   * Link to the view of the specific CRD 
                   * @param CRD: this a CRD
                   */}
                  <Link to={{
                    pathname: '/customresources/' + CRD.metadata.name,
                    state: {
                      CRD: CRD
                    }
                  }} >
                    <Title level={4} >
                      {<Badge color="#108ee9" />}
                      Kind: {CRD.spec.names.kind}
                    </Title>
                  </Link>
                </div>
              </div>
              <Tabs defaultActiveKey="1">
                <Tabs.TabPane tab="Description" key="1">
                  {
                    CRD.metadata.annotations.description ? (
                      <div>{CRD.metadata.annotations.description}</div>
                      ) : <div>This CRD has no description</div>
                  }
                </Tabs.TabPane>
              </Tabs>
            </div>
          </div>
        </div>
      );
    });

    return (
      <div className="crds-container">
        <ResponsiveGridLayout className="react-grid-layout" layouts={this.state.layout} margin={[40, 40]}
                              breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                              cols={{lg: 2, md: 2, sm: 1, xs: 1, xxs: 1}} rowHeight={300}
                              compactType={'horizontal'}>
          {CRDViews}
        </ResponsiveGridLayout>
        {!this.state.isLoading && CRDViews.length === 0 ? (
          <div className="no-crds-found">
            <span>No CRDs Found.</span>
          </div>
        ) : null}
        {this.state.isLoading ? <LoadingIndicator /> : null}
      </div>
    );
  }
}

export default withRouter(CRDList);
