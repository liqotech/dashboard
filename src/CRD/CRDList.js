import React, { Component } from 'react';
import { Badge, Breadcrumb, Empty, notification, Rate, Tabs, Typography } from 'antd';
import LoadingIndicator from '../common/LoadingIndicator';
import { Link, withRouter } from 'react-router-dom';
import './CRDList.css';
import './CRD.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-resizable/css/styles.css';
const ResponsiveGridLayout = WidthProvider(Responsive);
import { Pagination } from 'antd';
import ReactResizeDetector from 'react-resize-detector';

class CRDList extends Component {
  constructor(props) {
    super(props);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
    /**
     * @param: isLoading: boolean
     * @param: CRDs: array of CRDs
     */
    this.state = {
      CRDs: this.props.api.CRDs,
      CRDshown: [],
      isLoading: true,
      layout: {lg: []},
      oldBr: null,
      currentPage: 1
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
    this.generateLayout(CRDs.slice(10*(this.state.currentPage-1), 10*this.state.currentPage));
  }

  componentDidMount() {
    this.loadCustomResourceDefinitions();
  }

  componentWillUnmount() {
    this.props.api.CRDListCallback = null;
  }

  /** When going to another page, change the CRDs shown */
  paginationChange(current, size){
    if(current !== this.state.currentPage){
      this.state.currentPage = current;
      let CRDsubset = this.state.CRDs.slice(size*(current-1), size*current);
      this.generateLayout(CRDsubset);
    }
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

    /**
     * When changing from lg layout to sm
     * let the CRDs remain in alphabetical order
     */
    if(this.state.oldBr === 'sm'){
      layout = [];
      for(let i = 0; i < CRDs.length; i++) {
        layout.push({
          i: CRDs[i].metadata.name, x: 0, y: Math.floor(i), w: 1, h: 1, static: true
        });
      }
    } else {
      for(let i = 0; i < CRDs.length; i++) {
        layout.push({
          i: CRDs[i].metadata.name, x: i%2, y: Math.floor(i/2), w: 1, h: 1, static: true
        });
      }
    }

    this.setState({
      layout: {lg: layout},
      isLoading: false
    });

  }

  /** If the size breakpoint has changed, re-sort the CRD list */
  onBreakpointChange(br){
    if(!this.state.oldBr){
      this.state.oldBr = br;
    } else if(this.state.oldBr !== br){
      this.state.oldBr = br;
      this.generateLayout(this.state.CRDshown);
    }
  }

  /** Update CRD with the 'favourite' annotation */
  handleClick_fav(CRD){
    if(!CRD.metadata.annotations || !CRD.metadata.annotations.favourite){
      CRD.metadata.annotations.favourite = 'true';
    } else {
      CRD.metadata.annotations.favourite = null;
    }
    this.props.api.updateCustomResourceDefinition(
      CRD.metadata.name,
      CRD
    )
  }

  render() {
    const CRDViews = [];
    this.state.CRDshown.forEach(CRD => {
      CRDViews.push(
        <div className="crd-content" key={CRD.metadata.name} aria-label={'crd'}>
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
                  <Typography.Title level={4} >
                    {<Badge color="#108ee9" />}
                    <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
                      pathname: '/customresources/' + CRD.metadata.name,
                      state: {
                        CRD: CRD
                      }
                    }} >
                      Kind: {CRD.spec.names.kind}
                    </Link>
                    { CRD.metadata.annotations ? (
                      <Rate className="crd-fav" count={1} defaultValue={CRD.metadata.annotations.favourite ? 1 : 0}
                            onChange={() => {this.handleClick_fav(CRD)}}
                            style={{marginLeft: 0}}
                      />
                    ) : (
                      <Rate className="crd-fav" count={1} defaultValue={0}
                            onChange={() => {this.handleClick_fav(CRD)}}
                            style={{marginLeft: 0}}
                      />
                    )}
                  </Typography.Title>
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
      <div>
        {
         /**
         * This is an ugly workaround but it's the best solution I found:
         *  it is necessary because the ResponsiveGridLayout's WidthProvider
         *  only detect width resize when the actual window is being resized,
         *  so here I trigger the event to trick it
         */
        }
        <ReactResizeDetector skipOnMount handleWidth
                             refreshMode={'throttle'} refreshRate={150}
                             onResize={() => {
                               window.dispatchEvent(new Event('resize'));
                             }} />
        <div className="crds-container">
          <ResponsiveGridLayout className="react-grid-layout" layouts={this.state.layout} margin={[40, 40]}
                                breakpoints={{lg: 1000, md: 796, sm: 568}}
                                cols={{lg: 2, md: 2, sm: 1}} rowHeight={300}
                                compactType={'horizontal'} onBreakpointChange={this.onBreakpointChange}>
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
              <Pagination defaultCurrent={this.state.currentPage} total={this.state.CRDs.length}
                          onChange={this.paginationChange}
                          showSizeChanger={false} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default withRouter(CRDList);
