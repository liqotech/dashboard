import React, { useState } from 'react';
import {
  Row, Col, Popconfirm,
  Alert, Space, Button,
  Typography, Tooltip,
  message,
} from 'antd';
import { Link } from 'react-router-dom';
import {
  ExclamationCircleOutlined, LoadingOutlined,
  DragOutlined, PushpinOutlined, DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import ResourceBreadcrumb from '../common/ResourceBreadcrumb';
import FavouriteButton from '../common/buttons/FavouriteButton';
import UpdateCR from '../../editors/CRD/UpdateCR';

function ResourceHeader(props) {
  const [isPinned, setIsPinned] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  /*const editDescription = async (value) => {
    props.resource.metadata.annotations = {...props.resource.metadata.annotations, description: value};

    await props.updateFunc(
      props.resource.metadata.name,
      props.resource.metadata.namespace,
      props.resource
    )
  }*/

  /** Delete the Resource */
  const handleClick_delete = () => {
    let promise = props.deleteFunc(
      props.resource.metadata.name,
      props.resource.metadata.namespace,
    )

    promise
      .then(() => {
        props.deleted.current = true;
        setDeleting(true);
        message.success(props.kind + ' terminating...');
      })
      .catch(() => {
        message.error('Could not delete the ' + props.kind);
      });
  }

  return (
    <Alert.ErrorBoundary>
      <div style={{width: '100%', backgroundColor: '#f0f2f5', paddingBottom: 16, paddingTop: 20}}>
        <Row align={'bottom'}>
          <Col span={20}>
            <Row align={'bottom'}>
              <Col>
                <ResourceBreadcrumb />
              </Col>
              <Col>
                <Tooltip title={props.resource.metadata.name} placement={'top'}>
                  <Typography.Title level={3} style={{marginBottom: 0}}>
                    {props.altName ? props.altName
                      : props.name}
                  </Typography.Title>
                </Tooltip>
              </Col>
              <Col>
                {deleting ? (
                  <div>
                    <Typography.Text type={'secondary'} style={{marginLeft: 10, marginRight: 5}}>(terminating</Typography.Text>
                    <LoadingOutlined />)
                  </div>
                ) : null}
              </Col>
              <Col>
                <span style={{marginLeft: 10}}>
                  <FavouriteButton resourceName={props.resource.metadata.name}
                                   favourite={(props.resource.metadata.annotations &&
                                     props.resource.metadata.annotations.favourite) ? 1 : 0
                                   }
                                   resourceList={[props.resource]}
                  />
                </span>
              </Col>
            </Row>
          </Col>
          <Col span={4}>
            <div style={{float: "right"}}>
              <Space align={'center'}>
                {props.onCustomResource ? (
                  <div>
                    <Button icon={<EditOutlined/>}
                            type={'primary'}
                            onClick={() => setShowUpdate(true)}
                    >
                      EDIT
                    </Button>
                    <UpdateCR CR={props.resource} CRD={props.onCustomResource}
                              setShowUpdate={setShowUpdate}
                              showUpdate={showUpdate}
                    />
                  </div> ) : null
                }
                <Popconfirm
                  placement="topRight"
                  title="Are you sure?"
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }}/>}
                  onConfirm={handleClick_delete}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="primary" danger icon={<DeleteOutlined />}>
                    DELETE
                  </Button>
                </Popconfirm>
              </Space>
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
