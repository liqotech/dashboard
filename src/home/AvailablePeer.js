import React, { Component } from 'react';
import {
  Space, Dropdown, Menu,
  Row, Tooltip,
  Avatar, Tag, Collapse, Typography, Button, Tabs, Modal, Col
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

class AvailablePeer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      lan: false,
      loading: false,
      backgroundColor: 'white',
      showProperties: false
    }

    this.join = this.join.bind(this);
    this.disconnect = this.disconnect.bind(this);
  }

  join() {
    this.props.foreignCluster.spec.join = true;

    updatePeeringStatus(this,
      'Connecting to ' + this.props.foreignCluster.metadata.name,
      'Could not connect');
  }

  componentWillUnmount() {
    this.state.backGroundColor = 'white';
  }

  disconnect() {
    this.props.foreignCluster.spec.join = false;

    updatePeeringStatus(this,
      'Stopping trying to connect to ' + this.props.foreignCluster.metadata.name,
      'Could not disconnect');
  }

  render() {

    this.state.lan = this.props.foreignCluster.spec.discoveryType === 'LAN';

    this.state.loading = !!this.props.foreignCluster.spec.join;

    if(this.props.refused){
      this.state.loading = false;
    }

    let advertisement;

    if(this.props.foreignCluster.status && this.props.foreignCluster.status.outgoing.advertisement){
      advertisement = this.props.advertisements.find(adv =>
        {return adv.metadata.name === this.props.foreignCluster.status.outgoing.advertisement.name}
      )
    }

    let peeringRequest;

    if(this.props.foreignCluster.status && this.props.foreignCluster.status.incoming.peeringRequest){
      peeringRequest = this.props.peeringRequests.find(pr =>
        {return pr.metadata.name === this.props.foreignCluster.status.incoming.peeringRequest.name}
      )
    }

    const menu = (
      <Menu>
        {this.state.loading ? (
          <Menu.Item key={'connect'} icon={<LinkOutlined />} onClick={() => {this.disconnect()}}>
            Stop Connecting
          </Menu.Item>
        ) : (
          <Menu.Item key={'connect'} icon={<LinkOutlined />} onClick={() => {this.join()}}>
            Connect
          </Menu.Item>
        )}
        <Menu.Item key={'properties'} icon={<ToolOutlined />}
                   onClick={() => {this.setState({showProperties: true})}}
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
                    style={{backgroundColor: this.state.backgroundColor}}
                    onChange={(collapsed) => {
                      if(collapsed){
                        this.setState({backgroundColor: '#e6f7ff'})
                      } else {
                        this.setState({backgroundColor: 'white'})
                      }
                    }}
          >
            <Collapse.Panel header={
              <Space size={'large'}>
                <div>
                  <Row justify={'center'}>
                    <Tooltip placement={'top'} title={
                      this.props.refused ?
                        this.props.reason
                        :
                        this.state.lan ? 'Connect through LAN' : 'Connect through Internet'
                    }>
                      <div onClick={() => this.join()}>
                        <Avatar.Group>
                          <Avatar
                            size="large"
                            style={{
                              backgroundColor: '#1890ff',
                            }}
                            //src={require('../assets/database.png')}
                            icon={<ClusterOutlined />}
                          />
                          <Avatar
                            size="small"
                            style={this.props.refused ?
                              {
                                backgroundColor: '#f5222d'
                              } : {
                                backgroundColor: '#87d068'
                              }
                            }
                            icon={
                              this.props.refused ? <CloseOutlined /> :
                                this.state.loading ? <LoadingOutlined/> :
                                this.state.lan ? <WifiOutlined/> : <GlobalOutlined/>
                            }
                          />
                        </Avatar.Group>
                      </div>
                    </Tooltip>
                  </Row>
                </div>
                <Tooltip placement={'top'} title={this.props.foreignCluster.spec.clusterID}>
                  <Tag color="blue" style={{ maxWidth: '13vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {this.props.foreignCluster.spec.clusterID}
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
            key={this.props.foreignCluster.metadata.name + '_available'}
            style={{border: 0}}
            >
              <div style={{paddingLeft: '1em', paddingBottom: '1em'}}>
                <Row align={'middle'}>
                  <Col flex={2}>
                    <Typography.Text type={'secondary'}>
                      { this.props.refused ?
                        this.props.reason
                        :
                        this.props.foreignCluster.spec.discoveryType
                      }
                      { this.state.loading && !this.props.refused ?
                        <span>, <>{this.props.reason ? this.props.reason : 'connecting...'}</></span>
                        :
                        null
                      }
                    </Typography.Text>
                  </Col>
                  <Col flex={3}>
                    <div style={{float: 'right'}}>
                      <Button style={{marginRight: '1em'}}
                              onClick={() => {this.setState({showProperties: true})}}
                      >
                        Properties
                      </Button>
                      { this.state.loading ? (
                        <Button style={{ float: 'right' }} type={'danger'} onClick={() => this.disconnect()}>
                          Stop Connecting
                        </Button>
                      ) : (
                        <Button style={{ float: 'right' }} type={'primary'} onClick={() => this.join()}>
                          Connect
                        </Button>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </Collapse.Panel>
          </Collapse>
          {getPeerProperties(advertisement, peeringRequest, this)}
        </div>
      </div>
    )
  }
}

export default AvailablePeer;
