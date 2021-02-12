import {
  Alert,
  Modal,
  Select,
  Input,
  Typography,
  Row,
  Col,
  Badge,
  message
} from 'antd';
import React, { useRef, useState } from 'react';
import PlusSquareOutlined from '@ant-design/icons/lib/icons/PlusSquareOutlined';
import { dashLowercase } from '../services/stringUtils';
import { ResourceAutocomplete } from '../common/ResourceAutocomplete';
import _ from 'lodash';

function AddCustomView() {
  const [showAddCV, setShowAddCV] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);
  const [noNameAlert, setNoNameAlert] = useState(false);
  let viewName = useRef('');

  const handleSubmit = () => {
    if (viewName.current === '') setNoNameAlert(true);
    else {
      let namespace = 'default';
      let CRD = window.api.getCRDFromKind('View');

      let resources = [];
      selectedResources.forEach(res => {
        resources.push({
          resourceName: _.capitalize(res.split('/').slice(-1).join('')),
          resourcePath: res
        });
      });

      let item = {
        apiVersion: CRD.spec.group + '/' + CRD.spec.version,
        kind: CRD.spec.names.kind,
        metadata: {
          name: dashLowercase(viewName.current),
          namespace: namespace
        },
        spec: {
          component: false,
          enabled: true,
          resources: resources,
          viewName: viewName.current
        }
      };

      window.api
        .createCustomResource(
          CRD.spec.group,
          CRD.spec.version,
          namespace,
          CRD.spec.names.plural,
          item
        )
        .then(() => {
          setSelectedResources([]);
          setShowAddCV(false);
        })
        .catch(error => {
          console.log(error);
          message.error('Could not create custom view');
        });
    }
  };

  return (
    <div>
      <div onClick={() => setShowAddCV(true)}>
        <div>
          <PlusSquareOutlined style={{ fontSize: '20px' }} />
          <span>New Custom View</span>
        </div>
      </div>
      <Modal
        destroyOnClose
        title={'New Custom View'}
        visible={showAddCV}
        onOk={handleSubmit}
        onCancel={() => {
          setSelectedResources([]);
          setShowAddCV(false);
        }}
      >
        {noNameAlert ? (
          <Alert
            message="Please choose a name for your custom view"
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Row align={'middle'} gutter={[16, 16]}>
          <Col span={6}>
            <Badge
              text={<Typography.Text strong>View Name</Typography.Text>}
              status={'processing'}
            />
          </Col>
          <Col span={18}>
            <Input
              placeholder={'Insert name'}
              role={'input'}
              onChange={e => {
                viewName.current = e.target.value;
              }}
            />
          </Col>
        </Row>
        <Row align={'middle'} gutter={[16, 16]}>
          <Col span={6}>
            <Badge
              text={<Typography.Text strong>Resources</Typography.Text>}
              status={'processing'}
            />
          </Col>
          <Col span={18}>
            <ResourceAutocomplete
              multiple
              style={{ width: '100%' }}
              onSearch={res =>
                setSelectedResources(prev => {
                  prev.push(res);
                  return prev;
                })
              }
              onDeselect={res =>
                setSelectedResources(prev => {
                  prev = prev.filter(resource => resource !== res);
                  return prev;
                })
              }
            />
          </Col>
        </Row>
      </Modal>
    </div>
  );
}

export default AddCustomView;
