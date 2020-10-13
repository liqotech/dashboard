import React, { useEffect, useState } from 'react';
import { Alert, Button, Divider, PageHeader, Space, Tooltip, Typography } from 'antd';
import FilterOutlined from '@ant-design/icons/lib/icons/FilterOutlined';
import ConnectedPeer from './ConnectedPeer';
import { checkAdvertisement, checkPeeringRequest } from './HomeUtils';
import { LIQO_LABEL_ENABLED } from '../constants';
import LoadingIndicator from '../common/LoadingIndicator';

function ListConnected(props){
  
  const [outgoingPods, setOutgoingPods] = useState([]);
  const [incomingPods, setIncomingPods] = useState([]);
  const [loadingServer, setLoadingServer] = useState(true);
  const [loadingClient, setLoadingClient] = useState(true);

  useEffect(() => {
    getClientPODs();
    getServerPODs();
    /**
     * Every 30 seconds the metrics are retrieved and the view updated
     */
    let interval = setInterval( () => {
      getClientPODs();
      getServerPODs();
    }, 30000);

    return () => {
      clearInterval(interval);
    }
  }, [])

  /**
   * Searches for pods in namespaces labeled with the LIQO_LABEL_ENABLED
   * The pods in these namespaces are the only one that can be
   * offloaded to the foreign cluster
   */
  const getClientPODs = () => {
    window.api.getNamespaces(LIQO_LABEL_ENABLED)
      .then(async (res) => {
        let _outgoingPods = [];
        await Promise.all(res.body.items.map(async (ns) => {
          await window.api.getPODs(ns.metadata.name)
            .then(async res => {
              await Promise.all(res.body.items.map(po => {
                _outgoingPods.push(po);
              }))
            })
            .catch(error => {
              console.log(error);
            })
        }))
        setOutgoingPods(_outgoingPods);
        setLoadingClient(false);
      }).catch(error => console.log(error));
  }

  /**
   * For now, there in no way to restrict the field of pods
   * scheduled in the vk (offloaded to the home cluster)
   * so we take all pods
   */
  const getServerPODs = () => {
    window.api.getPODsAllNamespaces().
    then(res => {
      let pods = res.body.items;
      setIncomingPods(pods);
      setLoadingServer(false);
    })
    .catch(error => {
      console.log(error);
      setLoadingServer(false);
    })
  }

  let connectedPeers = [];

  props.foreignClusters.forEach(fc => {

    let client;
    let server;

    /** I am the client and I am using your resources, so check
     * if there is an advertisement
     */
    if(fc.status.outgoing.joined && fc.status.outgoing.advertisement){
      client = checkAdvertisement(props.advertisements, fc.status.outgoing.advertisement).adv;
    }

    /** I am the server and you are using my resources, so check
     * if there is a peering request
     */
    if(fc.status.incoming.joined && fc.status.incoming.peeringRequest){
      server = checkPeeringRequest(props.peeringRequests, fc.status.incoming.peeringRequest);
    }

    if(client || server){
      connectedPeers.push(
        <div key={fc.spec.clusterIdentity.clusterID}>
          <ConnectedPeer {...props} incomingPods={incomingPods}
                         outgoingPods={outgoingPods}
                         foreignCluster={fc} client={client} server={server} />
        </div>
      )
    }
  });

  return (
    <div className="home-header">
      <div style={{position: 'fixed', zIndex: 10, width: '100%', backgroundColor: 'white'}}>
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
      </div>
      <div style={{paddingTop: '5.5vh'}} >
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
          loadingServer || loadingClient ? <LoadingIndicator /> :
          <div>{connectedPeers}</div>
        )}
      </div>
    </div>
  )

}

export default ListConnected;
