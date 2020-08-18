import React, { Component } from 'react';
import { Alert, Button, Divider, Modal, notification, PageHeader, Space, Tabs, Tooltip, Typography } from 'antd';
import PlusOutlined from '@ant-design/icons/lib/icons/PlusOutlined';
import FormGenerator from '../editors/OAPIV3FormGenerator/FormGenerator';
import AvailablePeer from './AvailablePeer';
import { checkAdvertisement, checkPeeringRequest } from './HomeUtils';
import { APP_NAME } from '../constants';

class ListAvailable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAddPeer: false,
    }

    this.submit = this.submit.bind(this);
  }

  submit(item){
    let CRD = this.props.api.getCRDfromKind(item.kind)

    this.setState({isLoading: true});

    let promise = this.props.api.createCustomResource(
      CRD.spec.group,
      CRD.spec.version,
      null,
      CRD.spec.names.plural,
      item
    );

    promise
      .then(() => {
        this.setState({
          isLoading: false,
          showAddPeer: false
        });
        notification.success({
          message: APP_NAME,
          description: 'Peer added'
        });
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          isLoading: false
        });
        notification.error({
          message: APP_NAME,
          description: 'Could not add peer'
        });
      });
  }

  render() {

    let availablePeers = [];

    this.props.foreignClusters.forEach(fc => {

      let visibleP = true;
      let visibleA = true;
      let reason = '';
      let refused = false;

      /** If foreign cluster is already joined, don't show */
      if (fc.spec.join && fc.status){
        if(fc.status.outgoing.joined && fc.status.outgoing.advertisement){
          let adv = checkAdvertisement(this.props.advertisements, fc.status.outgoing.advertisement);
          visibleA = !adv.adv;
          reason = adv.reason;
          if(adv.reason === 'Advertisement Refused'){
            refused = true;
          }
        }
        if(fc.status.incoming.joined && fc.status.incoming.peeringRequest){
          visibleP = !checkPeeringRequest(this.props.peeringRequests, fc.status.incoming.peeringRequest);
        }
      }

      if(visibleA && visibleP){
        availablePeers.push(
          <div key={fc.spec.clusterID}>
            <AvailablePeer {...this.props} foreignCluster={fc}
                           refused={refused} reason={reason}
            />
          </div>
        )
      }
    });

    const availablePeersCard = (
      <div>
        <PageHeader style={{paddingTop: 4, paddingBottom: 4, paddingLeft: 16, paddingRight: 16}}
                    title={
                      <div className={'draggable'}>
                        <Typography.Text strong style={{fontSize: 24}}>Available Peers</Typography.Text>
                      </div>
                    }
                    extra={
                      <Tooltip title={'Add new peer'}>
                        <Button type={'primary'}
                                onClick={() => {
                                  this.setState({showAddPeer: true});
                                }}
                                icon={<PlusOutlined />} style={{marginTop: 2}}/>
                      </Tooltip>
                    }
        />
        <Divider style={{marginTop: 0, marginBottom: 0}}/>
        { availablePeers.length === 0 ? (
          <div style={{ padding: '1em' }}>
            <Alert
              message="No peer available at the moment"
              description={
                <Typography.Link underline onClick={() => {this.setState({showAddPeer: true})}}>
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
    )

    return (
      <div className="home-header">
        {availablePeersCard}
        <div>
          { /** This modal let the user add a peer by creating a new foreign cluster or search domain */ }
          <Modal
            visible={this.state.showAddPeer}
            onCancel={() => {this.setState({showAddPeer: false})}}
            bodyStyle={{paddingTop: 0}}
            width={'30vw'}
            footer={null}
            destroyOnClose
          >
            <Tabs>
              <Tabs.TabPane tab={'Add domain'} key={1}>
                <FormGenerator CRD={this.props.api.getCRDfromKind('SearchDomain')} submit={this.submit}/>
              </Tabs.TabPane>
              <Tabs.TabPane tab={'Add remote peer'} key={2}>
                <FormGenerator CRD={this.props.api.getCRDfromKind('ForeignCluster')} submit={this.submit}/>
              </Tabs.TabPane>
            </Tabs>
          </Modal>
        </div>
      </div>
    )
  }
}

export default ListAvailable;
