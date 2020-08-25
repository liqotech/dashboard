import React, { Component } from 'react';
import { Avatar, Button, Col, Collapse, Dropdown, Menu, Progress, Row, Space, Tag, Tooltip, Typography } from 'antd';
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
      incomingPods: [],
      incomingPodsPercentage: [],
      incomingTotalPercentage: {
        CPU: 0,
        RAM: 0
      },
      outgoingPods: [],
      outgoingPodsPercentage: [],
      outgoingTotalPercentage: {
        CPU: 0,
        RAM: 0
      },
      showDetails: false,
      sharing: false
    }

    this.flagOut = false;
    this.flagInc = false;

    /**
     * Every 30 seconds the metrics are retrieved and the view updated
     */
    this.interval = setInterval( () => {
      console.log('hello')
      this.updatePODPercentage();
    }, 30000);

    this.disconnect = this.disconnect.bind(this);
  }

  getPODPercentage(po, res){
    let allocatableCPU = 0;
    let allocatableRAM = 0;
    let usedCPU = 0;
    let usedRAM = 0;
    po.spec.containers.forEach(co => {
      allocatableCPU += parseInt(co.resources.requests.cpu);
      allocatableRAM += parseInt(co.resources.requests.memory);
    })
    res.containers.forEach(co => {
      usedCPU += parseInt(co.usage.cpu);
      usedRAM += parseInt(co.usage.memory)/1024;
    })

    return {
      name: po.metadata.name,
      CPU: Math.round(((usedCPU / allocatableCPU) * 100) * 10) / 10,
      RAM: Math.round(((usedRAM / allocatableRAM) * 100) * 10) / 10,
      RAMmi: Math.round(usedRAM * 10) / 10,
      CPUmi: Math.round(usedCPU * 10) / 10
    }
  }

  /** */
  updatePODPercentage(){

    if(this.props.server){
      let home_podsPercentage = [];
      let home_totalMemory = 0;
      let home_totalCPU = 0;
      let home_totalPodsRAM = 0;
      let home_totalPodsCPU = 0;
      let home_counter = 0;
      this.props.homeNodes.forEach(no => {
        home_totalMemory += parseInt(no.status.allocatable.memory);
        home_totalCPU += parseInt(no.status.allocatable.cpu);
      })
      this.state.incomingPods.forEach(po => {
        this.props.api.getMetricsPOD(po.metadata.namespace, po.metadata.name)
          .then(res => {
            home_counter++;

            let podPercentage = this.getPODPercentage(po, res);

            home_podsPercentage.push(podPercentage);

            home_totalPodsRAM += podPercentage.RAMmi * 1024;
            home_totalPodsCPU += podPercentage.CPUmi * 1024;

            let totalRAMPercentage = home_totalPodsRAM / (home_totalMemory * this.props.config.spec.advertisementConfig.resourceSharingPercentage / 100) * 100;
            let totalCPUPercentage = home_totalPodsCPU / (home_totalCPU * this.props.config.spec.advertisementConfig.resourceSharingPercentage / 100) * 100;

            if(home_counter === this.state.incomingPods.length){
              this.setState({
                  incomingPodsPercentage: home_podsPercentage,
                  incomingTotalPercentage: {
                    RAM: Math.round(totalRAMPercentage * 10) / 10,
                    CPU: Math.round(totalCPUPercentage * 10) / 10
                  }
                }, this.props.updateFCMetrics(true, {
                  fc: this.props.foreignCluster.spec.clusterID,
                  RAM: home_totalPodsRAM,
                  CPU: home_totalPodsCPU
                })
              )
            }
          })
          .catch(error => {
            console.log(error);
          })
      })
    }

    if(this.props.client){
      let foreign_podsPercentage = [];
      let foreign_totalMemory = 0;
      let foreign_totalCPU = 0;
      let foreign_totalPodsRAM = 0;
      let foreign_totalPodsCPU = 0;
      let foreign_counter = 0;

      let adv = this.props.advertisements.find(adv =>
        {return adv.metadata.name === this.props.foreignCluster.status.outgoing.advertisement.name}
      );

      foreign_totalMemory = adv.spec.resourceQuota.hard.memory;
      foreign_totalCPU = adv.spec.resourceQuota.hard.cpu;

      this.state.outgoingPods.forEach(po => {
        this.props.api.getMetricsPOD(po.metadata.namespace, po.metadata.name)
          .then(res => {
            foreign_counter++;

            let podPercentage = this.getPODPercentage(po, res);

            foreign_podsPercentage.push(podPercentage);

            foreign_totalPodsRAM += podPercentage.RAMmi * 1024;
            foreign_totalPodsCPU += podPercentage.CPUmi * 1024;

            let totalRAMPercentage = foreign_totalPodsRAM / adv.spec.resourceQuota.hard.memory * 100;
            let totalCPUPercentage = foreign_totalPodsCPU / adv.spec.resourceQuota.hard.cpu * 100;

            if(foreign_counter === this.state.outgoingPods.length){
              this.setState({
                  outgoingPodsPercentage: foreign_podsPercentage,
                  outgoingTotalPercentage: {
                    RAM: Math.round(totalRAMPercentage * 10) / 10,
                    CPU: Math.round(totalCPUPercentage * 10) / 10
                  }
                }, this.props.updateFCMetrics(false, {
                  fc: this.props.foreignCluster.spec.clusterID,
                  RAM: foreign_totalPodsRAM,
                  CPU: foreign_totalPodsCPU
                })
              )
            }
          })
          .catch(error => {
            console.log(error);
          })
      })
    }
  }

  checkFlag(flag){
    if(!flag)
      this.updatePODPercentage();
    return true;
  }

  /**
   * Search for pods offloaded to the foreign cluster
   */
  getClientPODs(){
    let vk = this.props.advertisements.find(adv =>
      {return adv.metadata.name === this.props.foreignCluster.status.outgoing.advertisement.name}
    ).status.vkReference.name;

    this.state.outgoingPods = this.props.outgoingPods.filter(po => { return po.spec.nodeName === vk });
    if(this.state.outgoingPods.length !== 0) this.state.sharing= true;
    this.flagOut = this.checkFlag(this.flagOut);
  }

  /**
   * Search for pods offloaded to the home cluster from a foreign one
   */
  getServerPODs(){
    let vk = 'liqo-' + this.props.foreignCluster.status.outgoing["remote-peering-request-name"];
    this.state.incomingPods = this.props.incomingPods.filter(po => {
      try {
        return po.metadata.annotations.home_nodename === vk
      } catch {
        return false
      }
    })
    if(this.state.incomingPods.length !== 0) this.state.sharing= true;
    this.flagInc = this.checkFlag(this.flagInc);
  }

  clientPercentage() {
    return this.state.outgoingTotalPercentage.RAM;
  }

  serverPercentage() {
    return this.state.incomingTotalPercentage.RAM;
  }

  /** Disconnect from peer (it makes foreignCluster's spec join parameter false) */
  disconnect() {
    this.props.foreignCluster.spec.join = false;

    updatePeeringStatus(this,
      'Disconnected from ' + this.props.foreignCluster.metadata.name,
      'Could not disconnect');
  }

  componentWillUnmount() {
    clearInterval(this.interval);
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
                      trailColor={(this.props.server &&  this.state.sharing) ? null : this.state.backgroundColor}
                      strokeColor={(this.props.server && this.state.sharing) ? getColor(serverPercent) : this.state.backgroundColor}
                      format={() => (
                        <Avatar
                          size="large"
                          style={this.state.sharing ? { backgroundColor: '#1890ff' } : { backgroundColor: '#ccc' }}
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
                      trailColor={(this.props.client &&   this.state.sharing) ? null : this.state.backgroundColor}
                      strokeColor={(this.props.client &&  this.state.sharing) ? getColor(clientPercent) : this.state.backgroundColor}
                      format={() => (
                        <Avatar
                          size="large"
                          style={this.state.sharing ? { backgroundColor: '#1890ff' } : { backgroundColor: '#ccc' }}
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
                    {  this.state.sharing ? ', sharing' : ', not sharing'}
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
        <ConnectionDetails {...this.props} _this={this}
                           outgoingPodsPercentage={this.state.outgoingPodsPercentage}
                           incomingPodsPercentage={this.state.incomingPodsPercentage}
                           outgoingTotalPercentage={this.state.outgoingTotalPercentage}
                           incomingTotalPercentage={this.state.incomingTotalPercentage}
        />

      </div>
    )
  }
}

export default ConnectedPeer;
