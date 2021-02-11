import { Col, Row, Typography } from 'antd';
import { LayoutOutlined } from '@ant-design/icons';
import React from 'react';
import CustomIcon from '../resources/common/CustomIcon';

export default function CustomViewHeader(props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Row align={'bottom'}>
        <Col>
          <div style={{ marginRight: 10 }}>
            <CustomIcon icon={props.customView.spec.icon} size={28} />
          </div>
        </Col>
        <Col>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            {props.customView.spec.viewName
              ? props.customView.spec.viewName
              : props.customView.metadata.name}
          </Typography.Title>
        </Col>
      </Row>
    </div>
  );
}
