import React, { Component } from 'react';
import { Badge, Breadcrumb, Empty, notification, Rate, Tabs, Typography } from 'antd';
import LoadingIndicator from '../common/LoadingIndicator';
import { Link, withRouter } from 'react-router-dom';
import './CRDList.css';
import './CRD.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-resizable/css/styles.css';
const ResponsiveGridLayout = WidthProvider(Responsive);
const { Title } = Typography;
import { APP_NAME } from '../constants';
import { Pagination } from 'antd';

class CRDList extends Component {
  constructor(props) {
    super(props);
    /**
     * @param: isLoading: boolean
     * @param: CRDs: array of CRDs
     */
    this.state = {
      CRDs: this.props.api.CRDs,
      CRDshown: [],
      isLoading: true,
      layout: {lg: []}
    };
    this.loadCustomResourceDefinitions = this.loadCustomResourceDefinitions.bind(this);
    if(this.props.api)
      this.props.api.CRDListCallback = this.loadCustomResourceDefinitions;
    this.paginationChange = this.paginationChange.bind(this);
  }

  loadCustomResourceDefinitions(CRDs) {
    if(!CRDs){
      CRDs = this.props.api.CRDs;
    }
    this.setState({
      CRDs: CRDs
    });
    this.generateLayout(CRDs.slice(0, 10));
  }

  componentDidMount() {
    this.loadCustomResourceDefinitions();
  }

  /** When going to another page, change the CRDs shown */
  paginationChange(current, size){
    let CRDsubset = this.state.CRDs.slice(size*(current-1), size*current);
    this.generateLayout(CRDsubset);
  }

  /**
   * Given a set (or subset) of CRD it generates the layout
   * @param CRDs a subset of the total of the CRDs
   */
  generateLayout(CRDs){
    let layout = [];

    this.setState({
      CRDshown: CRDs
    });

    for(let i = 0; i < CRDs.length; i++) {
      layout.push({
        i: CRDs[i].metadata.name, x: i%2, y: Math.floor(i/2), w: 1, h: 1, static: true
      });
    }
    this.setState({
      layout: {lg: layout},
      isLoading: false
    });
  }

  render() {
    const CRDViews = [];
    this.state.CRDshown.forEach(CRD => {
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
                    CRD.metadata.annotations && CRD.metadata.annotations.description ? (
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
            <Empty description={<strong>No CRDs found</strong>}/>
          </div>
        ) : null}
        {this.state.isLoading ? <LoadingIndicator /> : null}
        {!this.state.isLoading && CRDViews.length > 0 ? (
          <div className="no-crds-found" style={{marginTop: 30}}>
            <Pagination defaultCurrent={1} total={this.state.CRDs.length}
                        onChange={this.paginationChange}
                        showSizeChanger={false} />
          </div>
        ) : null}
      </div>
    );
  }
}

export default withRouter(CRDList);
