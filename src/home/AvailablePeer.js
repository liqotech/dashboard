import React, { useEffect, useState } from 'react';
import {
  Space, Dropdown, Menu,
  Row, Tooltip, Col,
  Avatar, Tag, Collapse, Typography, Button
} from 'antd';
import LinkOutlined from '@ant-design/icons/lib/icons/LinkOutlined';
import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';
import StarOutlined from '@ant-design/icons/lib/icons/StarOutlined';
import EllipsisOutlined from '@ant-design/icons/lib/icons/EllipsisOutlined';
import WifiOutlined from '@ant-design/icons/lib/icons/WifiOutlined';
import GlobalOutlined from '@ant-design/icons/lib/icons/GlobalOutlined';
import LoadingOutlined from '@ant-design/icons/lib/icons/LoadingOutlined';
import CloseOutlined from '@ant-design/icons/lib/icons/CloseOutlined';
import ClusterOutlined from '@ant-design/icons/lib/icons/ClusterOutlined';

import { updatePeeringStatus } from './HomeUtils';
import { getPeerProperties } from './PeerProperties';

function AvailablePeer(props) {

  const foreignClusterName = props.foreignCluster.spec.clusterIdentity.clusterName;
  const foreignClusterID = props.foreignCluster.spec.clusterIdentity.clusterID;
  let lan = props.foreignCluster.spec.discoveryType === 'LAN';
  let [loading, setLoading] = useState(props.foreignCluster.spec.join);
  let [backgroundColor, setBackgroundColor] = useState('white');
  const [showProperties, setShowProperties] = useState(false);

  useEffect(() => {
    return () => {
      backgroundColor = 'white';
    }
  }, []);

  const join = () => {
    props.foreignCluster.spec.join = true;

    updatePeeringStatus(props, loading, setLoading,
      'Connecting to ' + props.foreignCluster.metadata.name,
      'Could not connect');
  }

  const disconnect = () => {
    props.foreignCluster.spec.join = false;

    updatePeeringStatus(props, loading, setLoading,
      'Stopping trying to connect to ' + props.foreignCluster.metadata.name,
      'Could not disconnect');
  }

  if(props.refused){
    loading = false;
  }

  let advertisement;

  if(props.foreignCluster.status && props.foreignCluster.status.outgoing.advertisement){
    advertisement = props.advertisements.find(adv =>
      {return adv.metadata.name === props.foreignCluster.status.outgoing.advertisement.name}
    )
  }

  let peeringRequest;

  if(props.foreignCluster.status && props.foreignCluster.status.incoming.peeringRequest){
    peeringRequest = props.peeringRequests.find(pr =>
      {return pr.metadata.name === props.foreignCluster.status.incoming.peeringRequest.name}
    )
  }

  const menu = (
    <Menu>
      {loading ? (
        <Menu.Item key={'connect'} icon={<LinkOutlined />} onClick={() => {disconnect()}}>
          Stop Connecting
        </Menu.Item>
      ) : (
        <Menu.Item key={'connect'} icon={<LinkOutlined />} onClick={() => {join()}}>
          Connect
        </Menu.Item>
      )}
      <Menu.Item key={'properties'} icon={<ToolOutlined />}
                 onClick={() => {setShowProperties(true)}}
      >
        Properties
      </Menu.Item>
      <Menu.Item key={'favourite'} icon={<StarOutlined />}>
        Favourite
      </Menu.Item>
    </Menu>
  )

  return (
    <div>
      <div style={{ paddingTop: '1em', paddingBottom: '1em' }}>
        <Collapse accordion bordered={false}
                  style={{backgroundColor: backgroundColor}}
                  onChange={(collapsed) => {
                    if(collapsed){
                      setBackgroundColor('#e6f7ff')
                    } else {
                      setBackgroundColor('white')
                    }
                  }}
        >
          <Collapse.Panel header={
            <Space size={'large'}>
              <div>
                <Row justify={'center'}>
                  <Tooltip placement={'top'} title={
                    props.refused ?
                      props.reason
                      :
                      lan ? 'Connect through LAN' : 'Connect through Internet'
                  }>
                    <div onClick={() => join()}>
                      <Avatar.Group>
                        <Avatar
                          size="large"
                          style={{
                            backgroundColor: '#1890ff',
                          }}
                          icon={<ClusterOutlined />}
                        />
                        <Avatar
                          size="small"
                          style={props.refused ?
                            {
                              backgroundColor: '#f5222d'
                            } : {
                              backgroundColor: '#87d068'
                            }
                          }
                          icon={
                            props.refused ? <CloseOutlined /> :
                              loading ? <LoadingOutlined/> :
                              lan ? <WifiOutlined/> : <GlobalOutlined/>
                          }
                        />
                      </Avatar.Group>
                    </div>
                  </Tooltip>
                </Row>
              </div>
              <Tooltip placement={'top'} title={foreignClusterID}>
                <Tag color="blue" style={{ maxWidth: '13vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {foreignClusterName ? foreignClusterName : foreignClusterID}
                </Tag>
              </Tooltip>
            </Space>
          }
          extra={
            <span aria-label={'dropdown-available'} onClick={event => {event.stopPropagation()}}>
              <Dropdown.Button overlay={menu} trigger={['click']} icon={<EllipsisOutlined />} />
            </span>
          }
          showArrow={false}
          key={props.foreignCluster.metadata.name + '_available'}
          style={{border: 0}}
          >
            <div style={{paddingLeft: '1em', paddingBottom: '1em'}}>
              <Row align={'middle'}>
                <Col flex={2}>
                  <Typography.Text type={'secondary'}>
                    { props.refused ?
                      props.reason : props.foreignCluster.spec.discoveryType
                    }
                    { loading && !props.refused ?
                      <span>, <>{props.reason ? props.reason : 'connecting...'}</></span>
                      : null
                    }
                  </Typography.Text>
                </Col>
                <Col flex={3}>
                  <div style={{float: 'right'}}>
                    <Button style={{marginRight: '1em'}}
                            onClick={() => {setShowProperties(true)}}
                    >
                      Properties
                    </Button>
                    { loading ? (
                      <Button style={{ float: 'right' }} type={'danger'} onClick={() => disconnect()}>
                        Stop Connecting
                      </Button>
                    ) : (
                      <Button style={{ float: 'right' }} type={'primary'} onClick={() => join()}>
                        Connect
                      </Button>
                    )}
                  </div>
                </Col>
              </Row>
            </div>
          </Collapse.Panel>
        </Collapse>
        {getPeerProperties(advertisement, peeringRequest, props, showProperties, setShowProperties)}
      </div>
    </div>
  )
}

export default AvailablePeer;
