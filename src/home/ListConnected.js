import React, { Component } from 'react';
import { Alert, Button, Divider, PageHeader, Space, Switch, Tooltip, Typography } from 'antd';
import FilterOutlined from '@ant-design/icons/lib/icons/FilterOutlined';
import ConnectedPeer from './ConnectedPeer';
import { checkPeeringRequest, checkAdvertisement } from './HomeUtils';

class ListConnected extends Component {
  constructor(props) {
    super(props);

  }

  render() {
    let connectedPeers = [];

    this.props.foreignClusters.forEach(fc => {

      let client;
      let server;

      /** I am the client and I am using your resources, so check
       * if there is an advertisement
       */
      if(fc.status.outgoing.joined && fc.status.outgoing.advertisement){
        client = checkAdvertisement(this.props.advertisements, fc.status.outgoing.advertisement).adv;
      }

      /** I am the server and you are using my resources, so check
       * if there is a peering request
       */
      if(fc.status.incoming.joined && fc.status.incoming.peeringRequest){
        server = checkPeeringRequest(this.props.peeringRequests, fc.status.incoming.peeringRequest);
      }

      if(client || server){
        connectedPeers.push(
          <div key={fc.spec.clusterID}>
            <ConnectedPeer {...this.props}
                           foreignCluster={fc} client={client} server={server} />
          </div>
        )
      }
    });

    return (
      <div className="home-header">
        <PageHeader style={{ paddingTop: 4, paddingBottom: 4, paddingLeft: 16, paddingRight: 16 }}
                    title={
                      <Space>
                        <Typography.Text strong style={{ fontSize: 24 }}>Connected Peers</Typography.Text>
                      </Space>
                    }
                    extra={
                      <Space>
                        <Tooltip title={'Add filter'}>
                          {
                            //TODO: add some filter option
                          }
                          <Button type={'text'} icon={<FilterOutlined/>}/>
                        </Tooltip>
                      </Space>
                    }
                    className={'draggable'}
        />
        <Divider style={{ marginTop: 0, marginBottom: 0 }}/>
        { connectedPeers.length === 0 ? (
          <div style={{ padding: '1em' }}>
            <Alert
              message="No peer connected at the moment"
              description="Join one and start sharing!"
              type="info"
              showIcon
              closable
            />
          </div>
        ) : (
          <div>{connectedPeers}</div>
        )}
      </div>
    )
  }
}

export default ListConnected;
