import React, { Component } from 'react';
import { Empty, Rate, Typography, Table } from 'antd';
import LoadingIndicator from '../common/LoadingIndicator';
import { Link, withRouter } from 'react-router-dom';
import './CRDList.css';
import './CRD.css';
import 'react-resizable/css/styles.css';
import { Pagination } from 'antd';

class CRDList extends Component {
  constructor(props) {
    super(props);
    /**
     * @param: isLoading: boolean
     * @param: CRDshown: array of CRDs in the current page
     */
    this.state = {
      pageSize: 10,
      CRDshown: [],
      isLoading: true,
      currentPage: 1
    };
    this.loadCustomResourceDefinitions = this.loadCustomResourceDefinitions.bind(this);
    this.props.api.CRDListCallback = this.loadCustomResourceDefinitions;
    this.paginationChange = this.paginationChange.bind(this);
  }

  loadCustomResourceDefinitions() {
    this.generateLayout(this.props.api.CRDs.slice(this.state.pageSize*(this.state.currentPage-1), this.state.pageSize*this.state.currentPage));
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
      let CRDsubset = this.props.api.CRDs.slice(size*(current-1), size*current);
      this.generateLayout(CRDsubset);
    }
  }

  /**
   * Given a set (or subset) of CRD it generates the layout
   * @param CRDs a subset of the total of the CRDs
   */
  generateLayout(CRDs){
    this.setState({
      CRDshown: CRDs,
      isLoading: false
    });
  }

  /** Update CRD with the 'favourite' annotation */
  async handleClick_fav(CRD){

    CRD = this.state.CRDshown.find(item => {return item.metadata.name === CRD});

    if(!CRD.metadata.annotations || !CRD.metadata.annotations.favourite){
      CRD.metadata.annotations = {favourite: 'true'};
    } else {
      CRD.metadata.annotations.favourite = null;
    }
    await this.props.api.updateCustomResourceDefinition(
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
                    value={text ? 1 : 0}
                    onChange={async () => {await this.handleClick_fav(record.key)}}
                    style={{marginLeft: 0}}
              />
            }
          </>
        )
      }
    ]

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
            <Pagination defaultCurrent={this.state.currentPage} total={this.props.api.CRDs.length}
                        onChange={this.paginationChange} defaultPageSize={this.state.pageSize}
                        showSizeChanger={false} />
          </div>
        ) : null}
      </div>
    );
  }
}

export default withRouter(CRDList);
