import React, { useEffect, useState } from 'react';
import { Typography, Table } from 'antd';
import { Link, withRouter, useLocation } from 'react-router-dom';
import { getColumnSearchProps } from '../../services/TableUtils';
import ListHeader from '../resourceList/ListHeader';

function APIGroupList() {
  /**
   * @param: loading: boolean
   */
  const [loading, setLoading] = useState(true);
  const [APIGroups, setAPIGroups] = useState([]);

  let location = useLocation();

  useEffect(() => {
    loadAPIGroups();
  }, []);

  const loadAPIGroups = () => {
    window.api.getApis()
      .then(res => {
        setAPIGroups(res.body.groups);
        setLoading(false);
      })
      .catch(error => console.log(error));
  }

  const renderAPIGroups = (text, record, dataIndex) => {
    let APIGroup = APIGroups.find(item => {return item.name === record.key});
    return (
      dataIndex === 'Name' ? (
        <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
          pathname: location.pathname + '/' + APIGroup.preferredVersion.groupVersion
        }} >
          <Typography.Text strong>{text}</Typography.Text>
        </Link>
      ) : (
        <div>{text}</div>
      )
    )
  }

  const APIGroupViews = [];
  APIGroups.forEach(APIGroup => {
    APIGroupViews.push({
      key: APIGroup.name,
      Name: APIGroup.name,
      "Preferred Version": APIGroup.preferredVersion.groupVersion
    });
  });

  const columns = [
    {
      dataIndex: 'Name',
      key: 'Name',
      title: <div style={{marginLeft: '2em'}}>Name</div>,
      fixed: true,
      ...getColumnSearchProps('Name', renderAPIGroups)
    },
    {
      dataIndex: 'Preferred Version',
      key: 'Preferred Version',
      fixed: true,
      title: <div style={{marginLeft: '2em'}}>Preferred Version</div>,
      ...getColumnSearchProps('Preferred Version', renderAPIGroups)
    }
  ]

  return (
    <div>
      <ListHeader kind={'Apis'} />
      <Table columns={columns} dataSource={APIGroupViews}
             pagination={{ position: ['bottomCenter'],
               hideOnSinglePage: APIGroupViews < 11,
               showSizeChanger: true,
             }} showSorterTooltip={false}
             loading={loading}
      />
    </div>
  );
}

export default withRouter(APIGroupList);
