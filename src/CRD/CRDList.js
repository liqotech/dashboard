import React, { Component } from 'react';
import { Empty, Rate, Typography, Table } from 'antd';
import LoadingIndicator from '../common/LoadingIndicator';
import { Link, withRouter } from 'react-router-dom';
import './CRDList.css';
import './CRD.css';
import 'react-resizable/css/styles.css';
import { getColumnSearchProps } from '../services/TableUtils';

class CRDList extends Component {
  constructor(props) {
    super(props);
    /**
     * @param: isLoading: boolean
     */
    this.state = {
      CRD: this.props.api.CRD,
      isLoading: false,
    };
    this.loadCustomResourceDefinitions = this.loadCustomResourceDefinitions.bind(this);
    this.props.api.CRDListCallback = this.loadCustomResourceDefinitions;
  }

  loadCustomResourceDefinitions() {
    this.setState({CRD: this.props.api.CRD})
  }

  componentDidMount() {
    this.loadCustomResourceDefinitions();
  }

  componentWillUnmount() {
    this.props.api.CRDListCallback = null;
  }

  /** Update CRD with the 'favourite' annotation */
  async handleClick_fav(CRD){

    CRD = this.props.api.CRDs.find(item => {return item.metadata.name === CRD});

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

  renderCRDs = (text, record, dataIndex) => {
    let CRD = this.props.api.CRDs.find(item => {return item.metadata.name === record.key});
    return (
      dataIndex === 'Kind' ? (
        <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
          pathname: '/customresources/' + CRD.metadata.name,
          state: {
            CRD: CRD
          }
        }} >
          <Typography.Text strong>{text}</Typography.Text>
        </Link>
      ) : (
        <div>{text}</div>
      )
    )
  }

  render() {

    const CRDViews = [];
    this.props.api.CRDs.forEach(CRD => {
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
        Kind: CRD.spec.names.kind,
        Favourite: favourite,
        Group: CRD.spec.group,
        Description: description
      });
    });

    this.columns = [
      {
        title: 'Kind',
        dataIndex: 'Kind',
        key: 'Kind',
        ...getColumnSearchProps('Kind', this.renderCRDs)
      },
      {
        title: 'Description',
        dataIndex: 'Description',
        key: 'Description',
        ...getColumnSearchProps('Description', this.renderCRDs)
      },
      {
        title: 'Group',
        dataIndex: 'Group',
        key: 'Group',
        ...getColumnSearchProps('Group', this.renderCRDs)
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
          <Table columns={this.columns} dataSource={CRDViews} tableLayout={'fixed'}
                 pagination={{ position: ['bottomCenter'],
                               hideOnSinglePage: this.props.api.CRDs.length < 11,
                               showSizeChanger: true,
                 }}
          />
          ) : null}
        {!this.state.isLoading && CRDViews.length === 0 ? (
          <div className="no-crds-found">
            <Empty description={<strong>No CRDs found</strong>}/>
          </div>
        ) : null}
        {this.state.isLoading ? <LoadingIndicator /> : null}
      </div>
    );
  }
}

export default withRouter(CRDList);
