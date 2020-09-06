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
import { convertCPU, convertRAM, getColor, updatePeeringStatus } from './HomeUtils';
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
      incomingTotal: {
        percentage: {
          CPU: 0,
          RAM: 0
        },
        availablePercentage: {
          CPU: 0,
          RAM: 0
        },
        consumed: {
          CPU: 0,
          RAM: 0
        },
        available: {
          CPU: 0,
          RAM: 0
        }
      },
      outgoingPods: [],
      outgoingPodsPercentage: [],
      outgoingTotal: {
        percentage: {
          CPU: 0,
          RAM: 0
        },
        availablePercentage: {
          CPU: 0,
          RAM: 0
        },
        consumed: {
          CPU: 0,
          RAM: 0
        },
        available: {
          CPU: 0,
          RAM: 0
        }
      },
      showDetails: false,
      sharing: {
        server: false,
        client: false
      }
    }

    this.flagOut = false;
    this.flagInc = false;

    this.metricsNotAvailableIncoming = false;
    this.metricsNotAvailableOutgoing = false;

    /**
     * Every 30 seconds the metrics are retrieved and the view updated
     */
    this.interval = setInterval( () => {
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
      allocatableCPU += convertCPU(co.resources.requests.cpu);
      allocatableRAM += convertRAM(co.resources.requests.memory);
    });

    if(res === 404){
      usedCPU = allocatableCPU;
      usedRAM = allocatableRAM;
    } else {
      res.containers.forEach(co => {
        usedCPU += convertCPU(co.usage.cpu);
        usedRAM += convertRAM(co.usage.memory);
      });
    }

    return {
      name: po.metadata.name,
      CPU: Math.round(((usedCPU / allocatableCPU) * 100) * 10) / 10,
      RAM: Math.round(((usedRAM / allocatableRAM) * 100) * 10) / 10,
      RAMmi: Math.round(usedRAM * 10) / 10,
      CPUmi: Math.round(usedCPU * 10) / 10,
      CPUTot: Math.round(allocatableCPU * 10) / 10,
      RAMTot:Math.round(allocatableRAM * 10) / 10
    }
  }

  calculateIncomingMetricsPods(home, po, res){
    let podPercentage = this.getPODPercentage(po, res);

    home.podsPercentage.push(podPercentage);

    home.totalPodsRAM += podPercentage.RAMmi;
    home.totalPodsCPU += podPercentage.CPUmi;
    
    home.totalAllocatablePodsRAM += podPercentage.RAMTot;
    home.totalAllocatablePodsCPU += podPercentage.CPUTot;

    let totalRAMPercentage = home.totalPodsRAM / (home.totalMemory * this.props.config.spec.advertisementConfig.outgoingConfig.resourceSharingPercentage / 100) * 100;
    let totalCPUPercentage = home.totalPodsCPU / (home.totalCPU * this.props.config.spec.advertisementConfig.outgoingConfig.resourceSharingPercentage / 100) * 100;

    let totalAvailableRAMPercentage = home.totalAllocatablePodsRAM / (home.totalMemory * this.props.config.spec.advertisementConfig.outgoingConfig.resourceSharingPercentage / 100) * 100;
    let totalAvailableCPUPercentage = home.totalAllocatablePodsCPU / (home.totalCPU * this.props.config.spec.advertisementConfig.outgoingConfig.resourceSharingPercentage / 100) * 100;

    if(home.counter === this.state.incomingPods.length){
      this.setState({
          incomingPodsPercentage: home.podsPercentage,
          incomingTotal: {
            percentage: {
              RAM: Math.round(totalRAMPercentage * 10) / 10,
              CPU: Math.round(totalCPUPercentage * 10) / 10
            },
            availablePercentage: {
              RAM: Math.round(totalAvailableRAMPercentage * 10) / 10,
              CPU: Math.round(totalAvailableCPUPercentage * 10) / 10
            },
            consumed: {
              RAM: home.totalPodsRAM,
              CPU: home.totalPodsCPU
            },
            available: {
              RAM: (home.totalMemory * this.props.config.spec.advertisementConfig.outgoingConfig.resourceSharingPercentage / 100),
              CPU: (home.totalCPU * this.props.config.spec.advertisementConfig.outgoingConfig.resourceSharingPercentage / 100)
            }
          }
        }, this.props.updateFCMetrics(true, {
          fc: this.props.foreignCluster.spec.clusterID,
          RAM: home.totalPodsRAM,
          CPU: home.totalPodsCPU
        })
      )
    }

    return {
      home
    }
  }

  calculateOutgoingMetricsPods(foreign, po, res){
    let podPercentage = this.getPODPercentage(po, res);

    foreign.podsPercentage.push(podPercentage);

    foreign.totalPodsRAM += podPercentage.RAMmi;
    foreign.totalPodsCPU += podPercentage.CPUmi;

    foreign.totalAllocatablePodsRAM += podPercentage.RAMTot;
    foreign.totalAllocatablePodsCPU += podPercentage.CPUTot;

    let totalRAMPercentage = foreign.totalPodsRAM / foreign.totalMemory * 100;
    let totalCPUPercentage = foreign.totalPodsCPU / foreign.totalCPU * 100;

    let totalAvailableRAMPercentage = foreign.totalAllocatablePodsRAM / foreign.totalMemory * 100;
    let totalAvailableCPUPercentage = foreign.totalAllocatablePodsCPU / foreign.totalCPU * 100;

    if(foreign.counter === this.state.outgoingPods.length){
      this.setState({
          outgoingPodsPercentage: foreign.podsPercentage,
          outgoingTotal: {
            percentage: {
              RAM: Math.round(totalRAMPercentage * 10) / 10,
              CPU: Math.round(totalCPUPercentage * 10) / 10
            },
            availablePercentage: {
              RAM: Math.round(totalAvailableRAMPercentage * 10) / 10,
              CPU: Math.round(totalAvailableCPUPercentage * 10) / 10
            },
            consumed: {
              RAM: foreign.totalPodsRAM,
              CPU: foreign.totalPodsCPU
            },
            available: {
              RAM: foreign.totalMemory,
              CPU: foreign.totalCPU
            }
          }
        }, this.props.updateFCMetrics(false, {
          fc: this.props.foreignCluster.spec.clusterID,
          RAM: foreign.totalPodsRAM,
          CPU: foreign.totalPodsCPU
        })
      )
    }

    return {
      foreign
    }
  }

  /** */
  updatePODPercentage(){
    if(this.props.server){
      let home = {
        podsPercentage : [],
        totalMemory : 0,
        totalCPU : 0,
        totalPodsRAM : 0,
        totalPodsCPU : 0,
        totalAllocatablePodsRAM : 0,
        totalAllocatablePodsCPU : 0,
        counter : 0
      }
      this.props.homeNodes.forEach(no => {
        home.totalMemory += convertRAM(no.status.allocatable.memory);
        home.totalCPU += convertCPU(no.status.allocatable.cpu);
      })
      if(this.state.incomingPods.length === 0){
        this.setState({
            incomingPodsPercentage: [],
            incomingTotal: {
              percentage: {
                RAM: 0,
                CPU: 0
              },
              availablePercentage: {
                RAM: 0,
                CPU: 0
              },
              consumed: {
                RAM: 0,
                CPU: 0
              },
              available: {
                RAM: 0,
                CPU: 0
              }
            }
          }, this.props.updateFCMetrics(true, {
            fc: this.props.foreignCluster.spec.clusterID,
            RAM: 0,
            CPU: 0
          })
        )
      } else {
        this.state.incomingPods.forEach(po => {
          if(!this.metricsNotAvailableIncoming) {
            this.props.api.getMetricsPOD(po.metadata.namespace, po.metadata.name)
              .then(res => {
                home.counter++;
                let total = this.calculateIncomingMetricsPods(home, po, res);
                home.totalPodsRAM = total.home.totalPodsRAM;
                home.totalPodsCPU = total.home.totalPodsCPU;
              })
              .catch(error => {
                if (error === 404) {
                  this.metricsNotAvailableIncoming = true;
                  home.counter++;
                  let total = this.calculateIncomingMetricsPods(home, po, error);
                  home.totalPodsRAM = total.home.totalPodsRAM;
                  home.totalPodsCPU = total.home.totalPodsCPU;
                }
              })
          } else {
            home.counter++;
            let total = this.calculateIncomingMetricsPods(home, po, 404);
            home.totalPodsRAM = total.home.totalPodsRAM;
            home.totalPodsCPU = total.home.totalPodsCPU;
          }
        })
      }
    }

    if(this.props.client){
      let foreign = {
        podsPercentage : [],
        totalMemory : 0,
        totalCPU : 0,
        totalPodsRAM : 0,
        totalPodsCPU : 0,
        totalAllocatablePodsRAM : 0,
        totalAllocatablePodsCPU : 0,
        counter : 0
      }

      let adv = this.props.advertisements.find(adv =>
        {return adv.metadata.name === this.props.foreignCluster.status.outgoing.advertisement.name}
      );

      foreign.totalMemory = convertRAM(adv.spec.resourceQuota.hard.memory);
      foreign.totalCPU = convertCPU(adv.spec.resourceQuota.hard.cpu);

      if(this.state.outgoingPods.length === 0){
        this.setState({
            outgoingPodsPercentage: [],
            outgoingTotal: {
              percentage: {
                RAM: 0,
                CPU: 0
              },
              availablePercentage: {
                RAM: 0,
                CPU: 0
              },
              consumed: {
                RAM: 0,
                CPU: 0
              },
              available: {
                RAM: 0,
                CPU: 0
              }
            }
          }, this.props.updateFCMetrics(false, {
            fc: this.props.foreignCluster.spec.clusterID,
            RAM: 0,
            CPU: 0
          })
        )
      } else {
        this.state.outgoingPods.forEach(po => {
          if (!this.metricsNotAvailableOutgoing) {
            this.props.api.getMetricsPOD(po.metadata.namespace, po.metadata.name)
              .then(res => {
                foreign.counter++;
                let total = this.calculateOutgoingMetricsPods(foreign, po, res);
                foreign.totalPodsRAM = total.foreign.totalPodsRAM;
                foreign.totalPodsCPU = total.foreign.totalPodsCPU;
              })
              .catch(error => {
                if (error === 404) {
                  this.metricsNotAvailableOutgoing = true;
                  foreign.counter++;
                  let total = this.calculateOutgoingMetricsPods(foreign, po, error);
                  foreign.totalPodsRAM = total.foreign.totalPodsRAM;
                  foreign.totalPodsCPU = total.foreign.totalPodsCPU;
                }
              })
          } else {
            foreign.counter++;
            let total = this.calculateOutgoingMetricsPods(foreign, po, 404);
            foreign.totalPodsRAM = total.foreign.totalPodsRAM;
            foreign.totalPodsCPU = total.foreign.totalPodsCPU;
          }
        })
      }
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
    if(this.state.outgoingPods.length !== 0){
      this.state.sharing.client = true;
      this.flagOut = this.checkFlag(this.flagOut);
    } else {
      this.state.sharing.client = false;
    }
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
    if(this.state.incomingPods.length !== 0){
      this.state.sharing.server = true;
      this.flagInc = this.checkFlag(this.flagInc);
    } else {
      this.state.sharing.server = false;
    }
  }

  clientPercentage() {
    return this.state.outgoingTotal.percentage.RAM;
  }

  serverPercentage() {
    return this.state.incomingTotal.percentage.RAM;
  }

  /** Disconnect from peer (it makes foreignCluster's spec join parameter false) */
  disconnect() {
    this.props.foreignCluster.spec.join = false;

    updatePeeringStatus(this,
      'Disconnected from ' + this.props.foreignCluster.metadata.name,
      'Could not disconnect');
  }

  componentDidMount() {
    this.props.api.getMetricsNodes()
      .then(res => {
        /** That means there are no metrics available */
        if(res.items.length === 0){
          this.metricsNotAvailableIncoming = true;
          this.metricsNotAvailableOutgoing = true;
        } else {
          /** That means there are no metrics available from the virtual node */
          if(res.items.filter(no => { return no.metadata.name.slice(0, 5) === 'liqo-' }).length !== 0)
            this.metricsNotAvailableOutgoing = true;
        }
      }).catch(() => {
        this.metricsNotAvailableIncoming = true;
        this.metricsNotAvailableOutgoing = true;
    })
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render(){
    if(this.props.client) {
      this.getClientPODs();
    }

    if(this.props.server) {
      this.getServerPODs();
    }

    const menu = (
      <Menu>
        <Menu.Item key={'details'} icon={<SnippetsOutlined />}
                   onClick={() => {this.setState({showDetails: true})}}
        >
          Details
        </Menu.Item>
        <Menu.Item key={'properties'} icon={<ToolOutlined />}
                   onClick={() => {this.setState({showProperties: true})}}
        >
          Properties
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
                      trailColor={(this.props.server && (this.state.sharing.client || this.state.sharing.server)) ? null : this.state.backgroundColor}
                      strokeColor={(this.props.server && (this.state.sharing.client || this.state.sharing.server)) ? getColor(serverPercent) : this.state.backgroundColor}
                      format={() => (
                        <Avatar
                          size="large"
                          style={this.state.sharing.client || this.state.sharing.server ? { backgroundColor: '#1890ff' } : { backgroundColor: '#ccc' }}
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
                      trailColor={(this.props.client && (this.state.sharing.client || this.state.sharing.server)) ? null : this.state.backgroundColor}
                      strokeColor={(this.props.client && (this.state.sharing.client || this.state.sharing.server)) ? getColor(clientPercent) : this.state.backgroundColor}
                      format={() => (
                        <Avatar
                          size="large"
                          style={this.state.sharing.client || this.state.sharing.server ? { backgroundColor: '#1890ff' } : { backgroundColor: '#ccc' }}
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
                    {  this.state.sharing.client || this.state.sharing.server ? ', sharing' : ', not sharing'}
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
                           metricsNotAvailableIncoming={this.metricsNotAvailableIncoming}
                           metricsNotAvailableOutgoing={this.metricsNotAvailableOutgoing}
                           outgoingPodsPercentage={this.state.outgoingPodsPercentage}
                           incomingPodsPercentage={this.state.incomingPodsPercentage}
                           outgoingTotal={this.state.outgoingTotal}
                           incomingTotal={this.state.incomingTotal}
        />

      </div>
    )
  }
}

export default ConnectedPeer;
