import { Col, Row, Typography } from 'antd';
import React from 'react';
import ResourceBreadcrumb from '../common/ResourceBreadcrumb';
import { useParams, useLocation } from 'react-router-dom';

export default function ListHeader(props){
  let location = useLocation();
  let params = useParams();
  let title = '';

  if(params.resource)
    title = props.kind.slice(0, -4);
  else {
    if(params.group)
      title = params.group;
    else
      title = location.pathname.split('/')[1];
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
      </Row>
    </div>
  )
}
