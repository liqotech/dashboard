import React, { useEffect, useState } from 'react';
import { Typography, Table, List } from 'antd';
import { Link, withRouter, useLocation } from 'react-router-dom';
import { getColumnSearchProps } from '../../services/TableUtils';
import ListHeader from '../resourceList/ListHeader';
import ErrorRedirect from '../../error-handles/ErrorRedirect';
import { RightOutlined } from '@ant-design/icons';

function APIGroupList() {
  /**
   * @param: loading: boolean
   */
  const [error, setError] = useState();
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
      .catch(error =>
        setError(error)
      );
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
      ...getColumnSearchProps('Name', renderAPIGroups),
    },
    {
      dataIndex: 'Preferred Version',
      key: 'Preferred Version',
      title: <div style={{marginLeft: '2em'}}>Preferred Version</div>,
      ...getColumnSearchProps('Preferred Version', renderAPIGroups)
    }
  ]

  const expandedRowRender = (record) => {
    let versions = APIGroups.find(item => item.name === record.key).versions;
    const data = [];

    versions.forEach(version => {
      data.push(
        <div>
          <RightOutlined style={{paddingRight: 20}}/>
          <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
            pathname: location.pathname + '/' + version.groupVersion
          }} >
            <Typography.Text strong>{version.groupVersion}</Typography.Text>
          </Link>
        </div>
      )
    })

    return <List
      style={{marginTop: -16, marginBottom: -16}}
      bordered={false}
      dataSource={data}
      renderItem={item => (
        <List.Item>
          {item}
        </List.Item>
      )}
    />;
  };

  if(error)
    return <ErrorRedirect match={{params: {statusCode: error}}} />

  return (
    <div>
      <ListHeader kind={'Apis'} />
      <Table columns={columns} dataSource={APIGroupViews}
             pagination={{ position: ['bottomCenter'],
               hideOnSinglePage: APIGroupViews < 11,
               showSizeChanger: true,
             }} showSorterTooltip={false}
             expandable={{ expandedRowRender }}
             loading={loading}
      />
    </div>
  );
}

export default withRouter(APIGroupList);
