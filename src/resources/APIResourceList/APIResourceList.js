import React, { useEffect, useState } from 'react';
import { Typography, Table } from 'antd';
import { Link, withRouter, useLocation } from 'react-router-dom';
import { getColumnSearchProps } from '../../services/TableUtils';
import ListHeader from '../resourceList/ListHeader';
import ErrorRedirect from '../../error-handles/ErrorRedirect';

function APIResourceList() {
  /**
   * @param: loading: boolean
   */
  const [error, setError] = useState();
  const [loading, setLoading] = useState(true);
  const [APIResourceList, setAPIResourceList] = useState([]);
  const [kind, setKind] = useState('');

  let location = useLocation();

  useEffect(() => {
    loadAPIResourceList();
  }, []);

  const loadAPIResourceList = () => {
    window.api.getGenericResource(location.pathname)
      .then(res => {
        setKind(res.kind);
        setAPIResourceList(res.resources.filter(resource => resource.name.split('/').length === 1));
        setLoading(false);
      })
      .catch(error => setError(error));
  }

  const renderAPIResourceList = (text, record, dataIndex) => {
    let APIResource = APIResourceList.find(item => {return item.name === record.key});

    let path =
      location.pathname + '/' +
      (APIResource.namespaced && window.api.namespace.current ? 'namespaces/' + window.api.namespace.current + '/' : '') +
      APIResource.name;

    return (
      dataIndex === 'Name' ? (
        <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
          pathname: path,
        }} >
          <Typography.Text strong>{text}</Typography.Text>
        </Link>
      ) : (
        <div>{text}</div>
      )
    )
  }

  const APIResourceViews = [];
  APIResourceList.forEach(APIResource => {
    APIResourceViews.push({
      key: APIResource.name,
      Name: APIResource.name,
      Kind: APIResource.kind,
      Namespaced: APIResource.namespaced.toString()
    });
  });

  const columns = [
    {
      dataIndex: 'Name',
      key: 'Name',
      fixed: true,
      title: <div style={{marginLeft: '2em'}}>Name</div>,
      ...getColumnSearchProps('Name', renderAPIResourceList)
    },
    {
      dataIndex: 'Kind',
      key: 'Kind',
      fixed: true,
      title: <div style={{marginLeft: '2em'}}>Kind</div>,
      ...getColumnSearchProps('Kind', renderAPIResourceList)
    },
    {
      dataIndex: 'Namespaced',
      key: 'Namespaced',
      fixed: true,
      title: <div style={{marginLeft: '2em'}}>Namespaced</div>,
      ...getColumnSearchProps('Namespaced', renderAPIResourceList)
    },
  ]

  if(error)
    return <ErrorRedirect match={{params: {statusCode: error}}} />

  return (
    <div>
      <ListHeader kind={kind} />
      <Table columns={columns} dataSource={APIResourceViews}
             pagination={{ position: ['bottomCenter'],
               hideOnSinglePage: APIResourceViews < 11,
               showSizeChanger: true,
             }} showSorterTooltip={false}
             loading={loading}
      />
    </div>
  );
}

export default withRouter(APIResourceList);
