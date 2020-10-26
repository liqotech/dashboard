import { Col, Row, Typography, Button, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import ResourceBreadcrumb from '../common/ResourceBreadcrumb';
import { useParams, useLocation } from 'react-router-dom';
import { ApiOutlined, PlusOutlined } from '@ant-design/icons';
import NewResource from '../../editors/CRD/NewResource';
import { createNewConfig, getResourceConfig, updateResourceConfig } from '../common/DashboardConfigUtils';
import FavouriteButton from '../common/buttons/FavouriteButton';
import IconButton from '../common/buttons/IconButton';
import CustomIcon from '../common/CustomIcon';
import _ from 'lodash';

export default function ListHeader(props){
  const [onAddResource, setOnAddResource] = useState(false);
  const [onAddIcon, setOnAddIcon] = useState(false);

  let location = useLocation();
  let params = useParams();
  const title = useRef('');

  if(params.resource)
    title.current = props.kind;
  else {
    if(params.group)
      title.current = params.group;
    else
      title.current = location.pathname.split('/')[1];
  }

  const setIcon = (icon) => {
    setOnAddIcon(false);
    updateDashConfig(icon);
  }

  const updateDashConfig = (key) => {
    let tempResourceConfig = getResourceConfig(params, location);

    if(!_.isEmpty(tempResourceConfig)){
      tempResourceConfig.icon = key;
    } else {
      tempResourceConfig = createNewConfig(params, {kind: title.current}, location);
      /** The resource doesn't have a config, create one */
      tempResourceConfig.icon = key;
    }

    updateResourceConfig(tempResourceConfig, params, location);
  }

  const addResource = item => {
    let path = location.pathname;
    if(item.metadata.namespace && !params.namespace){
      path = '/' + location.pathname.split('/')[1] + '/' +
        (params.group ? params.group + '/' : '') +
        params.version + '/' +
        'namespaces/' + item.metadata.namespace + '/' +
        params.resource
    }
    return window.api.createGenericResource(path, item);
  }

  return(
    <div style={{marginBottom: 16}}>
      <Row align={'middle'}>
        <Col span={12}>
          <Row align={'bottom'}>
            <Col>
              <ResourceBreadcrumb />
            </Col>
            <Col>
              <Row align={'bottom'}>
                <Col>
                  {params.group || params.resource ? (
                  <Tooltip title={'Change Icon'}>
                    <Button onClick={() => setOnAddIcon(true)}
                            loading={onAddIcon}
                            style={{border: 'none', boxShadow: 'none', marginRight: 4, background: 'none'}}
                            icon={<CustomIcon icon={getResourceConfig(params, location).icon ? getResourceConfig(params, location).icon : 'ApiOutlined'}
                                        size={28}
                            />}
                    />
                  </Tooltip>
                  ) : <ApiOutlined style={{fontSize: '28px', marginRight: 4}} />}
                </Col>
                <Col>
                  <Typography.Title level={3} style={{marginBottom: 0}}>{title.current}</Typography.Title>
                </Col>
              </Row>
            </Col>
            <Col>
              {params.group || params.resource ? (
                <FavouriteButton {...props} list={true}
                                 favourite={getResourceConfig(params, location).favourite ?
                                   1 : 0}
                />
              ) : null}
            </Col>
          </Row>
        </Col>
        <Col span={12}>
          <div style={{float: 'right'}}>
            {params.resource ? (
              <Tooltip title={'Create ' + props.kind} placement={'topRight'}>
                <Button type={'primary'}
                        icon={<PlusOutlined/>}
                        onClick={() => {
                          setOnAddResource(true);
                        }}
                />
              </Tooltip>
            ) : null}
          </div>
        </Col>
      </Row>
      <IconButton setIcon={setIcon} onAddIcon={onAddIcon} setOnAddIcon={setOnAddIcon} />
      <NewResource showCreate={onAddResource} setShowCreate={setOnAddResource}
                   addFunction={addResource} {...props}
      />
    </div>
  )
}
