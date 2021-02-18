import React, { useState } from 'react';
import {
  Alert,
  Button,
  Divider,
  Modal,
  message,
  PageHeader,
  Tabs,
  Tooltip,
  Typography,
  Card
} from 'antd';
import PlusOutlined from '@ant-design/icons/lib/icons/PlusOutlined';
import FormGenerator from '../../editors/OAPIV3FormGenerator/FormGenerator';
import AvailablePeer from './AvailablePeer';
import { checkAdvertisement, checkPeeringRequest } from './HomeUtils';
import { APP_NAME } from '../../constants';
import DraggableWrapper from '../../common/DraggableWrapper';

function ListAvailable(props) {
  const [showAddPeer, setShowAddPeer] = useState(false);

  const submit = item => {
    let CRD = window.api.getCRDFromKind(item.kind);

    let promise = window.api.createCustomResource(
      CRD.spec.group,
      CRD.spec.version,
      null,
      CRD.spec.names.plural,
      item
    );

    promise
      .then(() => {
        setShowAddPeer(false);
        message.success('Peer added');
      })
      .catch(error => {
        console.error(error);
        message.error('Could not add peer');
      });
  };

  let availablePeers = [];

  props.foreignClusters.forEach(fc => {
    let visibleP = true;
    let visibleA = true;
    let reason = '';
    let refused = false;

    /** If foreign cluster is already joined, don't show */
    if (fc.spec.join && fc.status) {
      if (fc.status.outgoing.joined && fc.status.outgoing.advertisement) {
        let adv = checkAdvertisement(
          props.advertisements,
          fc.status.outgoing.advertisement
        );
        visibleA = !adv.adv;
        reason = adv.reason;
        if (adv.reason === 'Advertisement Refused') {
          refused = true;
        }
      }
      if (fc.status.incoming.joined && fc.status.incoming.peeringRequest) {
        visibleP = !checkPeeringRequest(
          props.peeringRequests,
          fc.status.incoming.peeringRequest
        );
      }
    }

    if (visibleA && visibleP) {
      availablePeers.push(
        <div key={fc.spec.clusterIdentity.clusterID}>
          <AvailablePeer
            {...props}
            foreignCluster={fc}
            refused={refused}
            reason={reason}
          />
        </div>
      );
    }
  });

  const availablePeersCard = (
    <div>
      <div style={{ position: 'fixed', zIndex: 10, width: '100%' }}>
        <DraggableWrapper>
          <PageHeader
            style={{
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 16,
              paddingRight: 16
            }}
            title={
              <Typography.Text strong style={{ fontSize: 24 }}>
                Available Peers
              </Typography.Text>
            }
            extra={
              <Tooltip title={'Add new peer'}>
                <Button
                  type={'primary'}
                  onClick={() => {
                    setShowAddPeer(true);
                  }}
                  icon={<PlusOutlined />}
                  style={{ marginTop: 2 }}
                />
              </Tooltip>
            }
          />
        </DraggableWrapper>
        <Divider style={{ marginTop: 0, marginBottom: 0 }} />
      </div>
      <div style={{ paddingTop: '5.5vh' }}>
        {availablePeers.length === 0 ? (
          <div style={{ padding: '1em' }}>
            <Alert
              message="No peer available at the moment"
              description={
                <Typography.Link
                  underline
                  onClick={() => {
                    setShowAddPeer(true);
                  }}
                >
                  Search for one
                </Typography.Link>
              }
              type="info"
              showIcon
              closable
            />
          </div>
        ) : (
          <div>{availablePeers}</div>
        )}
      </div>
    </div>
  );

  return (
    <Card
      bodyStyle={{ height: '100%', padding: 0 }}
      style={{ overflowY: 'auto', height: '100%', overflowX: 'hidden' }}
    >
      {availablePeersCard}
      <div>
        {/** This modal let the user add a peer by creating a new foreign cluster or search domain */}
        <Modal
          visible={showAddPeer}
          onCancel={() => {
            setShowAddPeer(false);
          }}
          bodyStyle={{ paddingTop: 0 }}
          width={'30vw'}
          footer={null}
          destroyOnClose
        >
          <Tabs>
            <Tabs.TabPane tab={'Add domain'} key={1}>
              <FormGenerator
                CRD={window.api.getCRDFromKind('SearchDomain')}
                submit={submit}
              />
            </Tabs.TabPane>
            <Tabs.TabPane tab={'Add remote peer'} key={2}>
              <FormGenerator
                CRD={window.api.getCRDFromKind('ForeignCluster')}
                submit={submit}
              />
            </Tabs.TabPane>
          </Tabs>
        </Modal>
      </div>
    </Card>
  );
}

export default ListAvailable;
