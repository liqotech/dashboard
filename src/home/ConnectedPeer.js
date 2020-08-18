import React, { Component } from 'react';
import {
  Col,
  Avatar, Collapse, Dropdown, Menu, Typography,
  Progress, Row, Space, Tag, Tooltip, Button
} from 'antd';
import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';
import EllipsisOutlined from '@ant-design/icons/lib/icons/EllipsisOutlined';
import SnippetsOutlined from '@ant-design/icons/lib/icons/SnippetsOutlined';
import AuditOutlined from '@ant-design/icons/lib/icons/AuditOutlined';
import CloseOutlined from '@ant-design/icons/lib/icons/CloseOutlined';
import UserOutlined from '@ant-design/icons/lib/icons/UserOutlined';
import ClusterOutlined from '@ant-design/icons/lib/icons/ClusterOutlined';
import SwapOutlined from '@ant-design/icons/lib/icons/SwapOutlined';
import SwapRightOutlined from '@ant-design/icons/lib/icons/SwapRightOutlined';
import SwapLeftOutlined from '@ant-design/icons/lib/icons/SwapLeftOutlined';
import { getColor, updatePeeringStatus } from './HomeUtils';
import { getPeerProperties } from './PeerProperties';
import ConnectionDetails from './ConnectionDetails';

class ConnectedPeer extends Component {
  constructor(props) {
    super(props);

    /**
     * @loading: if is connecting
     * @backgroundColor: if selected
     */
    this.state = {
      loading: false,
      backgroundColor: 'white',
      showProperties: false,
      outgoingPods: [],
      incomingPods: [],
      showDetails: false
    }

    this.disconnect = this.disconnect.bind(this);
  }

  /**
   * Search for pods offloaded to the foreign cluster
   */
  getClientPODs(){
    let vk = this.props.advertisements.find(adv =>
      {return adv.metadata.name === this.props.foreignCluster.status.outgoing.advertisement.name}
    ).status.vkReference.name;
    this.state.outgoingPods = this.props.outgoingPods.filter(po => { return po.spec.nodeName === vk });
  }

  /**
   * Search for pods offloaded to the home cluster from a foreign one
   */
  getServerPODs(){
    let vk = 'vk-' + this.props.foreignCluster.status.outgoing["remote-peering-request-name"];
    this.state.incomingPods = this.props.incomingPods.filter(po => {
        try {
          return po.metadata.annotations.home_nodename === vk
        }catch{return false}
      })
  }

  clientPercentage() {
    //TODO: retrieve client consumption percentage
    return 50;
  }

  serverPercentage() {
    //TODO: retrieve server consumption percentage
    return 90;
  }

  /** If there are pods offloaded, then there's sharing */
  checkSharing() {
    if(this.state.incomingPods.length !== 0 || this.state.outgoingPods.length !== 0 )
      return true;
  }

  /** Disconnect from peer (it makes foreignCluster's spec join parameter false) */
  disconnect() {
    this.props.foreignCluster.spec.join = false;

    updatePeeringStatus(this,
      'Disconnected from ' + this.props.foreignCluster.metadata.name,
      'Could not disconnect');
  }

  render(){
    if(this.props.client && this.props.outgoingPods.length !== 0) {
      this.getClientPODs();
    }

    if(this.props.server && this.props.incomingPods.length !== 0) {
      this.getServerPODs();
    }

    const menu = (
      <Menu>
        <Menu.Item key={'properties'} icon={<ToolOutlined />}
                   onClick={() => {this.setState({showProperties: true})}}
        >
          Properties
        </Menu.Item>
        <Menu.Item key={'details'} icon={<SnippetsOutlined />}
                   onClick={() => {this.setState({showDetails: true})}}
        >
          Details
        </Menu.Item>
        <Menu.Item key={'rules'} icon={<AuditOutlined />}>
          Rules
        </Menu.Item>
        <Menu.Item danger key={'disconnect'} icon={<CloseOutlined />} onClick={() => {this.disconnect()}}>
          Disconnect
        </Menu.Item>
      </Menu>
    )

    /** Quantity of available resources I am using on you */
    let clientPercent = 0;

    if(this.props.client)
      clientPercent = this.clientPercentage();

    /** Quantity of available resources you are using on me */
    let serverPercent = 0;

    if(this.props.server)
      serverPercent = this.serverPercentage();

    /** If there is resource sharing in general */
    let sharing = this.checkSharing();

    return(
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
            <>
              <Space size={'middle'}>
                <div>
                  <Tooltip title={
                    <div>You {this.props.server ? ': ' + serverPercent + '%' : null}</div>
                  } placement={'top'}>
                    <Progress
                      width={54}
                      type="circle"
                      percent={serverPercent}
                      strokeWidth={10}
                      trailColor={(this.props.server && sharing) ? null : this.state.backgroundColor}
                      strokeColor={(this.props.server && sharing) ? getColor(serverPercent) : this.state.backgroundColor}
                      format={() => (
                        <Avatar
                          size="large"
                          style={sharing ? { backgroundColor: '#1890ff' } : { backgroundColor: '#ccc' }}
                          icon={<UserOutlined />}
                        />
                      )}
                    />
                  </Tooltip>
                </div>
                {
                  (this.props.client && this.props.server) ? <SwapOutlined style={{fontSize: '2em'}} /> :
                  this.props.client ? <SwapRightOutlined style={{fontSize: '2em'}} /> : <SwapLeftOutlined style={{fontSize: '2em'}} />
                }
                <div>
                  <Tooltip title={this.props.client ? clientPercent + '%' : null} placement={'top'}>
                    <Progress
                      width={54}
                      type="circle"
                      percent={clientPercent}
                      strokeWidth={10}
                      trailColor={(this.props.client && sharing) ? null : this.state.backgroundColor}
                      strokeColor={(this.props.client && sharing) ? getColor(clientPercent) : this.state.backgroundColor}
                      format={() => (
                        <Avatar
                          size="large"
                          style={sharing ? { backgroundColor: '#1890ff' } : { backgroundColor: '#ccc' }}
                          icon={<ClusterOutlined />}
                        />
                      )}
                    />
                  </Tooltip>
                </div>
                <Tooltip placement={'top'} title={this.props.foreignCluster.spec.clusterID}>
                  <Tag style={{ maxWidth: '10vw', overflow: 'hidden', textOverflow: 'ellipsis'}}
                       color="blue">{this.props.foreignCluster.spec.clusterID}
                  </Tag>
                </Tooltip>
              </Space>
            </>
          }
          extra={
            <div aria-label={'dropdown-connected'} onClick={event => {event.stopPropagation()}}>
              <Dropdown.Button overlay={menu} trigger={['click']} icon={<EllipsisOutlined/>}/>
            </div>
          }
          showArrow={false}
          key={this.props.foreignCluster.metadata.name + '_connected'}
          style={{border: 0}}
          >
            <div style={{paddingLeft: '1em', paddingBottom: '1em'}}>
              <Row align={'middle'}>
                <Col flex={2}>
                  <Typography.Text type={'secondary'}>
                    { 'Connected on ' + this.props.foreignCluster.spec.discoveryType}
                    { sharing ? ', sharing' : ', not sharing'}
                  </Typography.Text>
                </Col>
                <Col flex={3}>
                  <div style={{float: 'right'}}>
                    <Button style={{marginRight: '1em'}}
                            onClick={() => {this.setState({showProperties: true})}}
                    >
                      Properties
                    </Button>
                    <Button type={'danger'} onClick={() => this.disconnect()}>
                      Disconnect
                    </Button>
                  </div>
                </Col>
              </Row>
            </div>
          </Collapse.Panel>
        </Collapse>

        { /** This modal shows the properties of the clusters */ }
        {getPeerProperties(this.props.client, this.props.server, this)}

        { /** This modal shows the detail of the connection */ }
        <ConnectionDetails {...this.props} _this={this}/>

      </div>
    )
  }
}

export default ConnectedPeer;
