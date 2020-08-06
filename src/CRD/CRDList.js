import React, { Component } from 'react';
import { Badge, Breadcrumb, Empty, notification, Rate, Tabs, Typography, Table } from 'antd';
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
    //this.onBreakpointChange = this.onBreakpointChange.bind(this);
    /**
     * @param: isLoading: boolean
     * @param: CRDs: array of CRDs
     */
    this.state = {
      pageSize: 10,
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

    this.columns = [
      {
        title: 'Kind',
        dataIndex: 'kind',
        render: (text, record) => (
          <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
                           pathname: '/customresources/' + this.state.CRDshown.find(item => {return item.metadata.name === record.key}).metadata.name,
                           state: {
                             CRD: this.state.CRDshown.find(item => {return item.metadata.name === record.key})
                           }
                         }} >
            <Typography.Text strong>{text}</Typography.Text>
          </Link>
        )
      },
      {
        title: 'Description',
        dataIndex: 'description'
      },
      {
        title: 'Group',
        dataIndex: 'group'
      },
      {
        title: 'Favourite',
        dataIndex: 'favourite',
        render: (text, record) => (
          <>
            {
              <Rate className="crd-fav" count={1} defaultValue={text ? 1 : 0}
                    onChange={() => {this.handleClick_fav(record.key)}}
                    style={{marginLeft: 0}}
              />
            }
          </>
        )
      }
    ]
  }

  loadCustomResourceDefinitions(CRDs) {
    if(!CRDs){
      CRDs = this.props.api.CRDs;
    }
    this.setState({
      CRDs: CRDs
    });
    this.generateLayout(CRDs.slice(this.state.pageSize*(this.state.currentPage-1), this.state.pageSize*this.state.currentPage));
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

    this.setState({
      layout: {lg: layout},
      isLoading: false
    });

  }

  /** Update CRD with the 'favourite' annotation */
  handleClick_fav(CRD){

    CRD = this.state.CRDshown.find(item => {return item.metadata.name === CRD});

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
      let favourite = false;
      let description = 'This CRD has no description';
      if(CRD.metadata.annotations){
        if(CRD.metadata.annotations.favourite)
          favourite = true;
        if(CRD.metadata.annotations.description)
          description = CRD.metadata.annotations.description
      }
      CRDViews.push({
        key: CRD.metadata.name,
        kind: CRD.spec.names.kind,
        favourite: favourite,
        group: CRD.spec.group,
        description: description
      });
    });

    return (
      <div>
        {!this.state.isLoading && CRDViews.length > 0 ? (
          <Table columns={this.columns} dataSource={CRDViews} pagination={false}/>
          ) : null}
        {!this.state.isLoading && CRDViews.length === 0 ? (
          <div className="no-crds-found">
            <Empty description={<strong>No CRDs found</strong>}/>
          </div>
        ) : null}
        {this.state.isLoading ? <LoadingIndicator /> : null}
        {!this.state.isLoading && CRDViews.length > 0 ? (
          <div className="no-crds-found" style={{marginTop: 30}}>
            <Pagination defaultCurrent={this.state.currentPage} total={this.state.CRDs.length}
                        onChange={this.paginationChange} defaultPageSize={this.state.pageSize}
                        showSizeChanger={false} />
          </div>
        ) : null}
      </div>
    );
  }
}

export default withRouter(CRDList);
