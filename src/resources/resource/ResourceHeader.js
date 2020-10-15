import React, { useState } from 'react';
import {
  Row, Col,
  Alert,
  Typography, Tooltip,
} from 'antd';
import { Link } from 'react-router-dom';
import DragOutlined from '@ant-design/icons/lib/icons/DragOutlined';
import PushpinOutlined from '@ant-design/icons/lib/icons/PushpinOutlined';
import ResourceBreadcrumb from '../common/ResourceBreadcrumb';

function ResourceHeader(props) {
  const [isPinned, setIsPinned] = useState(false);

  /*const editDescription = async (value) => {
    props.resource.metadata.annotations = {...props.resource.metadata.annotations, description: value};

    await props.updateFunc(
      props.resource.metadata.name,
      props.resource.metadata.namespace,
      props.resource
    )
  }*/

  return (
    <Alert.ErrorBoundary>
      <div style={{width: '100%', backgroundColor: '#f0f2f5', paddingBottom: 16, paddingTop: 20}}>
        <Row align={'bottom'}>
          <Col span={20}>
            <Row align={'bottom'}>
              <Col>
                {!props.onCustomView ? <ResourceBreadcrumb /> : null}
              </Col>
              <Col>
                <Link to={{
                  pathname: '/' + props.resourceRedirect + '/' + props.resource.metadata.name,
                  state: {
                    resource: props.resource
                  }
                }} >
                  <Tooltip title={props.resource.metadata.name} placement={'top'}>
                    <Typography.Title level={3} style={{marginBottom: 0}}>
                      {props.altName ? props.altName
                        : props.name}
                    </Typography.Title>
                  </Tooltip>
                </Link>
              </Col>
            </Row>
          </Col>
          <Col span={4}>
            <div style={{float: "right"}}>
            </div>
          </Col>
        </Row>
      </div>
        {/*<Row>
          <Col>
            <Descriptions style={{marginTop: 10, marginLeft: 15}}>
              <Descriptions.Item>
                <Typography.Paragraph editable={{ onChange: editDescription }} type={'secondary'} style={{marginBottom: 0}}>
                  {props.resource.metadata.annotations && props.resource.metadata.annotations.description ?
                    props.resource.metadata.annotations.description :
                    'No description for this CRD'
                  }
                </Typography.Paragraph >
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
        <Divider style={{marginTop: 0, marginBottom: 15}} />*/}
    </Alert.ErrorBoundary>
  );
}

export default ResourceHeader;
