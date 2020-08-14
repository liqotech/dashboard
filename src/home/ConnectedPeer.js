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

class ConnectedPeer extends Component {
  constructor(props) {
    super(props);

    /**
     * @loading: if is connecting
     * @backgroundColor: if selected
     */
    this.state = {
      loading: false,
      backgroundColor: 'white'
    }

    this.disconnect = this.disconnect.bind(this);
  }

  clientPercentage() {
    //TODO: retrieve client consumption percentage
    return 50;
  }

  serverPercentage() {
    //TODO: retrieve server consumption percentage
    return 90;
  }

  checkSharing() {
    //TODO: create sharing detect function
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

    const menu = (
      <Menu>
        <Menu.Item key={'properties'} icon={<ToolOutlined />}>
          Properties
        </Menu.Item>
        <Menu.Item key={'details'} icon={<SnippetsOutlined />}>
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

    /** If there is resource sharing */
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
                      trailColor={this.props.server ? null : this.state.backgroundColor}
                      strokeColor={this.props.server ? getColor(serverPercent) : this.state.backgroundColor}
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
                      trailColor={this.props.client ? null : this.state.backgroundColor}
                      strokeColor={this.props.client ? getColor(clientPercent) : this.state.backgroundColor}
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
      </div>
    )
  }
}

export default ConnectedPeer;
