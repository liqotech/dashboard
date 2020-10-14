import React, { useEffect, useState } from 'react';
import { Table } from 'antd';
import { withRouter, useLocation, useHistory, useParams } from 'react-router-dom';
import { getColumnSearchProps } from '../../services/TableUtils';
import ListHeader from './ListHeader';
import { resourceNotifyEvent } from '../common/ResourceUtils';
import { renderResourceList } from './ResourceListRenderer';
import { calculateAge } from '../../services/TimeUtils';

function ResourceList(props) {
  /**
   * @param: loading: boolean
   */
  const [loading, setLoading] = useState(true);
  const [resourceList, setResourceList] = useState([]);
  const [kind, setKind] = useState('');
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [columnContents, setColumnsContents] = useState([]);
  const [onCustomResource, setOnCustomResource] = useState(false);
  let location = useLocation();
  let history = useHistory();
  let params = useParams();

  useEffect(() => {
    loadResourceList();

    if(params.namespace)
      window.api.setNamespace(params.namespace);
    window.api.NSArrayCallback.current.push(changeNamespace);

    setOnCustomResource(
      window.api.CRDs.current.find(CRD => {
        return params.resource === CRD.spec.names.plural
      })
    )

    return () => {
      setLoading(true);
      setResourceList([]);
      setColumnsContents([]);
      setColumnHeaders([]);
      window.api.abortWatch(params.resource);
      window.api.NSArrayCallback.current = window.api.NSArrayCallback.current.filter(func => {return func !== changeNamespace});
    }
  }, [location]);

  useEffect(() => {
    manageColumnHeaders();
    manageColumnContents();
  }, [resourceList])

  const manageColumnHeaders = () => {
    let columns = [];

    columns.push(
      {
        dataIndex: 'Name',
        key: 'Name',
        ellipsis: true,
        fixed: 'left',
        ...getColumnSearchProps('Name', (text, record, dataIndex) =>
          renderResourceList(text, record, dataIndex, resourceList)
        ),
      },
      {
        dataIndex: 'Namespace',
        key: 'Namespace',
        ellipsis: true,
        ...getColumnSearchProps('Namespace', (text, record, dataIndex) =>
          renderResourceList(text, record, dataIndex, resourceList)
        ),
      }
    )

    columns.push({
      dataIndex: 'Age',
      key: 'Age',
      title: 'Age',
      fixed: 'right',
      ellipsis: true,
      width: '5em',
      sorter: {
        compare: (a, b) => a.Age.slice(0, -1) - b.Age.slice(0, -1),
      }
    })

    setColumnHeaders(columns);
  }

  const notifyEvent = (type, object) => {
    resourceNotifyEvent(setResourceList, type, object)
  }

  const manageColumnContents = () => {

    const resourceViews = [];
    resourceList.forEach(resource => {
      let object = {
        key: resource.metadata.name + '_' + resource.metadata.namespace,
        Age: calculateAge(resource.metadata.creationTimestamp)
      };

      object['Name'] = resource.metadata.name;
      object['Namespace'] = resource.metadata.namespace ? resource.metadata.namespace : null;

      resourceViews.push(object);
    });

    setColumnsContents([...resourceViews]);
  }

  const changeNamespace = () => {
    let path = '/' + location.pathname.split('/')[1] + '/' +
      (params.group ? params.group + '/' : '') +
      params.version + '/' +
      (window.api.namespace.current ? 'namespaces/' + window.api.namespace.current + '/' : '') +
      params.resource;

    history.push(path);
  }

  const loadResourceList = () => {
    window.api.getGenericResource(location.pathname)
      .then(res => {
        setKind(res.kind);
        setResourceList(res.items.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)));

        /** Start a watch for the list of resources */
        if(!props.onCustomView)
          window.api.watchResource(
            location.pathname.split('/')[1],
            (params.group ? params.group : undefined),
            (params.namespace ? params.namespace : undefined),
            params.version,
            params.resource,
            undefined,
            notifyEvent
          )

        setLoading(false);
      })
      .catch(error => {
        history.push('/error/' + error);
      });
  }

  return (
    <div>
      <ListHeader kind={kind.slice(0, -4)} resource={onCustomResource}/>
      <Table columns={columnHeaders} dataSource={columnContents}
             bordered scroll={{ x: 'max-content' }} sticky
             pagination={{ position: ['bottomCenter'],
               hideOnSinglePage: columnContents.length < 11,
               showSizeChanger: true,
             }} showSorterTooltip={false}
             loading={loading}
      />
    </div>
  );
}

export default withRouter(ResourceList);
