import { Col, Row, Typography, Button, Tooltip } from 'antd';
import React, { useState } from 'react';
import ResourceBreadcrumb from '../common/ResourceBreadcrumb';
import { useParams, useLocation } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import NewResource from '../../editors/CRD/NewResource';

export default function ListHeader(props){
  const [onAddResource, setOnAddResource] = useState(false);

  let location = useLocation();
  let params = useParams();
  let title = '';

  if(params.resource)
    title = props.kind;
  else {
    if(params.group)
      title = params.group;
    else
      title = location.pathname.split('/')[1];
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
              <Typography.Title level={3} style={{marginBottom: 0}}>{title}</Typography.Title>
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
      <NewResource showCreate={onAddResource} setShowCreate={setOnAddResource}
                   addFunction={addResource} {...props}
      />
    </div>
  )
}
