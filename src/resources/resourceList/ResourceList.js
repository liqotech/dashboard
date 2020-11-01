import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Button, Input, Table, Tooltip } from 'antd';
import { withRouter, useLocation, useHistory, useParams } from 'react-router-dom';
import { InsertRowRightOutlined } from '@ant-design/icons';
import { getColumnSearchProps } from '../../services/TableUtils';
import ListHeader from './ListHeader';
import { getNamespaced, filterResource, resourceNotifyEvent } from '../common/ResourceUtils';
import { renderResourceList } from './ResourceListRenderer';
import { calculateAge } from '../../services/TimeUtils';
import { createNewConfig, getResourceConfig, updateResourceConfig } from '../common/DashboardConfigUtils';
import FavouriteButton from '../common/buttons/FavouriteButton';
import KubernetesSchemaAutocomplete from '../common/KubernetesSchemaAutocomplete';
import { columnContentFunction } from './columnContentFunction';

function ResourceList(props) {
  /**
   * @param: loading: boolean
   */
  const [editColumn, setEditColumn] = useState('');
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState({});
  const [resourceList, setResourceList] = useState([]);
  const [kind, setKind] = useState('');
  const [resourceConfig, setResourceConfig] = useState({});
  const [columnHeaders, setColumnHeaders] = useState([]);
  const [columnContents, setColumnsContents] = useState([]);
  const [onCustomResource, setOnCustomResource] = useState(false);
  const [render, setRender] = useState(false);
  let location = props._location ? props._location : useLocation();
  let history = useHistory();
  let params = props._params ? props._params : useParams();

  useEffect(() => {
    if(params.namespace) {
      window.api.NSArrayCallback.current.push(changeNamespace);
      loadResourceList();
    } else {
      getNamespaced(location.pathname)
        .then(res => {
          if(res && res.namespaced)
            window.api.NSArrayCallback.current.push(changeNamespace);
          else
            params.namespace = undefined;
          loadResourceList();
        })
        .catch(error => {
          console.log(error);
          params.namespace = undefined;
          loadResourceList();
        });
    }
    getDashConfig();
    if(!props.onRef){
      window.api.DCArrayCallback.current.push(getDashConfig);
    }
    setOnCustomResource(() => {
      if(params.resource && params.group){
        return window.api.getCRDFromName(params.resource + '.' + params.group);
      }
    })

    return () => {
      setLoading(true);
      setResourceList([]);
      setResourceConfig({});
      setColumnsContents([]);
      setColumnHeaders([]);
      window.api.abortWatch(params.resource);
      window.api.NSArrayCallback.current = window.api.NSArrayCallback.current.filter(func => {return func !== changeNamespace});
      window.api.DCArrayCallback.current = window.api.DCArrayCallback.current.filter(func => {
        return func !== getDashConfig;
      });
    }
  }, [location.pathname, render]);

  useEffect(() => {
    manageColumnHeaders();
    manageColumnContents();
  }, [resourceList, resourceConfig, editColumn])

  const notifyEvent = (type, object) => {
    if(props.onRef) {
      if(filterResource(props, [object])[0])
        resourceNotifyEvent(setResourceList, type, object);
    } else resourceNotifyEvent(setResourceList, type, object);
  }

  const manageColumnHeaders = () => {
    let columns = [];

    if(!props.onRef){
      columns.push(
        {
          title: '',
          fixed: 'left',
          dataIndex: 'Favourite',
          width: '1em',
          sortDirections: ['descend'],
          align: 'center',
          ellipsis: true,
          sorter: {
            compare: (a, b) => a.Favourite - b.Favourite,
          },
          render: (text, record) => (
            <FavouriteButton favourite={text} resourceList={resourceList}
                             resourceName={record.Name}
            />
          )
        }
      )
    }

    if(!_.isEmpty(resourceConfig) && resourceConfig.render && resourceConfig.render.columns){
      let index = 0;
      resourceConfig.render.columns.forEach(column => {
        columns.push({
          dataIndex: column.columnTitle,
          key: column.columnContent,
          width: '10em',
          ellipsis: true,
          fixed: (index === 0 ? 'left' : false),
          ...getColumnSearchProps(column.columnTitle, (text, record, dataIndex) =>
            renderResourceList(text, record, dataIndex, resourceList)
          ),
          title: (
            editColumn === column.columnContent ? (
              <div style={{marginLeft: '2em'}} onClick={() => setEditColumn(column.columnContent)}>
                <Input placeholder={'Remove ' + column.columnTitle} size={'small'} autoFocus
                       defaultValue={column.columnTitle} aria-label={'editColumn'}
                       onBlur={(e) => {
                         updateDashConfig(column.columnContent, e.target.value)
                       }}
                       onPressEnter={(e) => {
                         updateDashConfig(column.columnContent, e.target.value)
                       }}
                />
              </div>
            ) : (
              <div style={{marginLeft: '2em'}} >
                <span onClick={() => {
                  if(!props.onRef)
                    setEditColumn(column.columnContent);
                }}>
                  {column.columnTitle}
                </span>
                {index === resourceConfig.render.columns.length - 1 && !props.onRef ? (
                  <span style={{float: 'right'}}>
                    { /** The one to last column is where the 'add a column' button is located */ }
                    <Tooltip title={'Add column'} >
                      <Button icon={<InsertRowRightOutlined style={{fontSize: 20}}/>}
                              style={{marginRight: '-1em', border: 0}}
                              size={'small'}
                              onClick={() => {
                                addColumnHeader(true);
                              }}
                      />
                    </Tooltip>
                  </span>
                ) : null}
              </div>
            )
          ),
        })
        index++;
      })
    } else {
      columns.push(
        {
          dataIndex: 'Name',
          key: 'Name',
          title: <div style={{marginLeft: '2em'}}>Name</div>,
          ellipsis: true,
          fixed: 'left',
          ...getColumnSearchProps('Name', (text, record, dataIndex) =>
            renderResourceList(text, record, dataIndex, resourceList)
          ),
        },
        {
          dataIndex: 'Namespace',
          key: 'Namespace',
          title: (
            <div style={{marginLeft: '2em'}}>
              <span>Namespace</span>
              <span style={{float: 'right'}}>
                { /** The one to last column is where the 'add a column' button is located */ }
                <Tooltip title={'Add column'} >
                      <Button icon={<InsertRowRightOutlined style={{fontSize: 20}}/>}
                              style={{marginRight: '-1em', border: 0}}
                              size={'small'}
                              onClick={() => {
                                addColumnHeader(true);
                              }}
                      />
                </Tooltip>
              </span>
            </div>
          ),
          ellipsis: true,
          ...getColumnSearchProps('Namespace', (text, record, dataIndex) =>
            renderResourceList(text, record, dataIndex, resourceList)
          ),
        }
      )
    }

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

  const manageColumnContents = () => {
    const resourceViews = [];
    resourceList.forEach(resource => {
      let favourite = 0;
      if(resource.metadata.annotations && !props.onRef){
        if(resource.metadata.annotations.favourite)
          favourite = 1;
      }
      let object = {
        key: resource.metadata.name + '_' + resource.metadata.namespace,
        Favourite: favourite,
        Age: calculateAge(resource.metadata.creationTimestamp)
      };

      if(!_.isEmpty(resourceConfig) && resourceConfig.render && resourceConfig.render.columns) {
        resourceConfig.render.columns.forEach(column => {
          object[column.columnTitle] = columnContentFunction(resource, column.columnContent);
        })
      } else {
        object['Name'] = resource.metadata.name;
        object['Namespace'] = resource.metadata.namespace ? resource.metadata.namespace : null;
      }

      resourceViews.push(object);
    });

    setColumnsContents([...resourceViews]);
  }

  const getDashConfig = () => {
    setResourceConfig(() => {
      return getResourceConfig(params, location);
    });
  }

  const changeNamespace = () => {
    let path = '/' + location.pathname.split('/')[1] + '/' +
      (params.group ? params.group + '/' : '') +
      params.version + '/' +
      (window.api.namespace.current ? 'namespaces/' + window.api.namespace.current + '/' : '') +
      params.resource;

    if(!props.onRef)
      history.push(path);
    else {
      location.pathname = path;
      params.namespace = window.api.namespace.current
      setRender(prev => !prev);
    }
  }

  const loadResourceList = () => {
    window.api.getGenericResource(location.pathname)
      .then(res => {
        setResource({...res});
        setKind(res.kind.slice(0, -4));
        if(props.onRef) {
          res.items = filterResource(props, res.items);
        }

        setResourceList(res.items.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name)));

        /** Start a watch for the list of resources */
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

  const updateDashConfig = (value, name) => {
    setEditColumn('');

    if(value === '')
      return;

    let tempResourceConfig = resourceConfig;

    if(!_.isEmpty(tempResourceConfig)){
      if(!tempResourceConfig.render) {
        tempResourceConfig.render = {};
      }
      if(!tempResourceConfig.render.columns) {
        tempResourceConfig.render.columns = [];
      }

      /** If there is a column render for this parameter, update it */
      let index = tempResourceConfig.render.columns.indexOf(
        tempResourceConfig.render.columns.find(column =>
          column.columnContent === value
        )
      );

      if(index !== -1){
        /** Delete column if no name */
        if(name === '')
          delete tempResourceConfig.render.columns[index];
        else
          tempResourceConfig.render.columns[index] = {
            columnTitle: name,
            columnContent: value
          }
      } else
        tempResourceConfig.render.columns.push({
          columnTitle: name,
          columnContent: value
        })
    } else {
      /** The resource doesn't have a config, create one */
      tempResourceConfig = createNewConfig(params, {kind: kind}, location);

      tempResourceConfig.render.columns.push({
        columnTitle: name,
        columnContent: value
      })
    }

    updateResourceConfig(tempResourceConfig, params, location);
  }

  const addColumnHeader = (setNew) => {
    if(setNew){
      setColumnHeaders(prev => {
        prev[prev.length - 2].title = (
          <div style={{marginLeft: '2em'}}>
            {prev[prev.length - 2].dataIndex}
          </div>
        )

        prev.splice(-1, 0, {
          dataIndex: 'NewColumn',
          key: 'NewColumn',
          title:
            <KubernetesSchemaAutocomplete kind={kind}
                                          CRD={onCustomResource}
                                          updateFunc={updateDashConfig}
                                          cancelFunc={() => addColumnHeader(false)}
            />,
          fixed: 'right',
          width: '20em'
        })
        return [...prev];
      });
    } else {
      setColumnHeaders(prev => {
        prev.splice(-2, 1);
        manageColumnHeaders();
        return [...prev];
      })
    }
  }

  return (
    <div>
      {!props.onRef ? (
        <ListHeader kind={kind} resource={onCustomResource} genericResource={resource} />
      ) : null}
      <Table columns={columnHeaders} dataSource={columnContents}
             size={props.onRef ? 'small' : 'default'}
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
