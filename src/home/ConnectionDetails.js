import React, { Component } from 'react';
import {
  Modal, Tabs, Typography, Tag, Badge, Space, Statistic,
  Row, Col, Card, Progress, Input, Button, Table, Tooltip, Divider
} from 'antd';
import InfoCircleOutlined from '@ant-design/icons/lib/icons/InfoCircleOutlined';
import HomeOutlined from '@ant-design/icons/lib/icons/HomeOutlined';
import GlobalOutlined from '@ant-design/icons/lib/icons/GlobalOutlined';
import { getColor } from './HomeUtils';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';
import ExclamationCircleTwoTone from '@ant-design/icons/lib/icons/ExclamationCircleTwoTone';
import { getColumnSearchProps } from '../services/TableUtils';

const n = Math.pow(10, 6);

class ConnectionDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: '1',
    }
  }

  getUsedTotal(role){
    if(!role)
      return this.props.outgoingTotal;
    else
      return this.props.incomingTotal;
  }

  PODtoTable(pods, role){

    const renderPODs = (text, record, dataIndex) => {
      let podNoRes = role ? this.props.incomingPodsPercentage.find(pod => {return text === pod.name}) :
        this.props.outgoingPodsPercentage.find(pod => {return text === pod.name})

      return (
        dataIndex === 'Status' ? (
          text === 'Running' ? <Tag color={'blue'}>{text}</Tag> : <Tag color={'red'}>{text}</Tag>
        ) : (
          dataIndex === 'Namespace' ? (
            <Tooltip title={text}>
              <Tag style={{ maxWidth: '5vw', overflow: 'hidden', textOverflow: 'ellipsis'}}>{text}</Tag>
            </Tooltip>
          ) : (
            <Row>
              <Col>
                <Tooltip title={text}>
                  <div style={{ maxWidth: '10vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                    {text}
                  </div>
                </Tooltip>
              </Col>
              { podNoRes && !podNoRes.resourcesRequestsPresent ? (
                <Col>
                  <Tooltip title={'POD doesn\'t have a resource limit'}>
                    <ExclamationCircleTwoTone style={{marginLeft: 4}} twoToneColor="#f5222d" />
                  </Tooltip>
                </Col>
              ) : null }
            </Row>
          )
        )
      )
    }

    const column = [
      {
        title: 'Name',
        dataIndex: 'Name',
        key: 'Name',
        ...getColumnSearchProps('Name', renderPODs)
      },
      {
        title: 'Status',
        dataIndex: 'Status',
        key: 'Status',
        ...getColumnSearchProps('Status', renderPODs)
      },
      {
        title: 'CPU (%)',
        dataIndex: 'CPU',
        key: 'CPU',
        render: (text, record) => {
          let podCPUmb = role ? (this.props.incomingPodsPercentage.find(pod => {return record.key === pod.name}) ?
            this.props.incomingPodsPercentage.find(pod => {return record.key === pod.name}).CPUmi / n : 0) :
            (this.props.outgoingPodsPercentage.find(pod => {return record.key === pod.name}) ?
              this.props.outgoingPodsPercentage.find(pod => {return record.key === pod.name}).CPUmi / n : 0)

          return(
            <Tooltip title={podCPUmb + 'm'}>
              <Progress percent={text}
                        status={'active'}
                        strokeColor={getColor(text, 0)}
              />
            </Tooltip>
          )
        },
        sorter: {
          compare: (a, b) => a.CPU - b.CPU
        },
      },
      {
        title: 'RAM (%)',
        dataIndex: 'RAM',
        key: 'RAM',
        render: (text, record) => {
          let podRAMmb = role ? (this.props.incomingPodsPercentage.find(pod => {return record.key === pod.name}) ?
            this.props.incomingPodsPercentage.find(pod => {return record.key === pod.name}).RAMmi / n : 0) :
            (this.props.outgoingPodsPercentage.find(pod => {return record.key === pod.name}) ?
            this.props.outgoingPodsPercentage.find(pod => {return record.key === pod.name}).RAMmi / n : 0)

          return(
            <Tooltip title={podRAMmb + 'Mi'}>
              <Progress percent={text}
                        status={'active'}
                        strokeColor={getColor(text, 0)}
              />
            </Tooltip>
          )
        },
        sorter: {
          compare: (a, b) => a.RAM - b.RAM
        },
      },
      {
        title: 'Namespace',
        dataIndex: 'Namespace',
        key: 'Namespace',
        ...getColumnSearchProps('Namespace', renderPODs)
      },
    ];

    const data = [];

    pods.forEach(po => {

      const pod = role ?
        this.props.incomingPodsPercentage.find(pod => {return po.metadata.name === pod.name}) :
        this.props.outgoingPodsPercentage.find(pod => {return po.metadata.name === pod.name})

      data.push(
        {
          key: po.metadata.name,
          Name: po.metadata.name,
          Status: po.status.phase,
          CPU: pod ? pod.CPU : 0,
          RAM: pod ? pod.RAM : 0,
          Namespace: po.metadata.namespace
        },
      )
    })

    return(
      <Table size={'small'} columns={column} dataSource={data}
             pagination={{ size: 'small', position: ['bottomCenter'], pageSize: 13 }} />
    )
  }

  /**
   * Get and show the used resources for a connection
   * @role: can be home or foreign
   */
  getUsedResources(role) {
    const total = this.getUsedTotal(role);

    let reserved = {
      CPU: (total.available.CPU * (total.availablePercentage.CPU / 100)).toFixed(2),
      RAM: (total.available.RAM * (total.availablePercentage.RAM / 100)).toFixed(2),
    }

    return(
      <div>
        <div style={{marginTop: 10}}>
          <Row>
            <Col flex={1}>
              <Card title={'Resources Used'} style={{marginRight: 20}}
                    extra={role ? (this.props.metricsNotAvailableIncoming ? (
                      <Tooltip title={'Precise metrics not available in your cluster'}>
                        <ExclamationCircleTwoTone twoToneColor="#f5222d" />
                      </Tooltip>
                    ) : null) : (this.props.metricsNotAvailableOutgoing ? (
                      <Tooltip title={'Precise metrics not available in this cluster'}>
                        <ExclamationCircleTwoTone twoToneColor="#f5222d" />
                      </Tooltip>
                    ) : null)}
              >
                <Row gutter={[20, 0]} align={'center'} justify={'center'}>
                  <Col>
                    <Row justify={'center'} gutter={[0, 20]}>
                      <Typography.Text strong>CPU</Typography.Text>
                    </Row>
                    <Row justify={'center'}>
                      <Progress
                        width={140}
                        type="dashboard"
                        percent={total.availablePercentage.CPU}
                        strokeWidth={5}
                        strokeColor={getColor(total.availablePercentage.CPU, 1)}
                        format={(totPercent) => (
                          <Progress type={'dashboard'} percent={total.percentage.CPU}
                                    strokeColor={getColor(total.percentage.CPU, 0)}
                                    format={(percent) =>
                                      (<div>
                                        <div>
                                          <Tooltip title={'Consumed'} placement={'right'}>
                                            <Typography.Text>{percent + '%'}</Typography.Text>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Tooltip title={'Reserved'} placement={'right'}>
                                            <Typography.Text type={'secondary'} style={{fontSize: '0.7em'}}>{totPercent + '%'}</Typography.Text>
                                          </Tooltip>
                                        </div>
                                      </div>)
                                    }
                          />
                        )}
                      />
                    </Row>
                    <Row>
                      <Statistic title={<div><Badge color={getColor(total.percentage.CPU, 0)}/> Consumed</div>}
                                 value={Math.round(total.consumed.CPU/n) + 'm'} suffix={'/ ' + Math.round(total.available.CPU/n) + 'm'} />
                    </Row>
                    <Row>
                      <Statistic title={<div><Badge color={getColor(total.availablePercentage.CPU, 1)}/> Reserved</div>}
                                 value={Math.round(reserved.CPU/n) + 'm'} suffix={'/ ' + Math.round(total.available.CPU/n) + 'm'} />
                    </Row>
                  </Col>
                </Row>
                <Divider />
                <Row gutter={[20, 0]} align={'center'} justify={'center'}>
                  <Col>
                    <Row justify={'center'} gutter={[0, 20]}>
                      <Typography.Text strong>RAM</Typography.Text>
                    </Row>
                    <Row justify={'center'}>
                      <Progress
                        width={142}
                        type="dashboard"
                        percent={total.availablePercentage.RAM}
                        strokeWidth={5}
                        strokeColor={getColor(total.availablePercentage.RAM, 1)}
                        format={(totPercent) => (
                          <Progress type={'dashboard'} percent={total.percentage.RAM}
                                    strokeColor={getColor(total.percentage.RAM, 0)}
                                    format={(percent) =>
                                      (<div>
                                        <div>
                                          <Tooltip title={'Consumed'} placement={'right'}>
                                            <Typography.Text>{percent + '%'}</Typography.Text>
                                          </Tooltip>
                                        </div>
                                        <div>
                                          <Tooltip title={'Reserved'} placement={'right'}>
                                            <Typography.Text type={'secondary'} style={{fontSize: '0.7em'}}>{totPercent + '%'}</Typography.Text>
                                          </Tooltip>
                                        </div>
                                      </div>)
                                    }
                          />
                        )}
                      />
                    </Row>
                    <Row>
                      <Statistic title={<div><Badge color={getColor(total.percentage.RAM, 0)}/> Consumed</div>}
                                 value={Math.round(total.consumed.RAM/n) + 'Mi'} suffix={'/ ' + Math.round(total.available.RAM/n) + 'Mi'} />
                    </Row>
                    <Row>
                      <Statistic title={<div><Badge color={getColor(total.availablePercentage.RAM, 1)}/> Reserved</div>}
                                 value={Math.round(reserved.RAM/n) + 'Mi'} suffix={'/ ' + Math.round(total.available.RAM/n) + 'Mi'} />
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col flex={23}>
              <Card title={ !role ?
                (<div>Outgoing PODs <Typography.Text type={'secondary'}>(your offloaded PODs)</Typography.Text></div>) :
                (<div>Incoming PODs <Typography.Text type={'secondary'}>(foreign hosted PODs)</Typography.Text></div>)}
                    bodyStyle={{padding: 0}}
              >
                { !role ? this.PODtoTable(this.props._this.state.outgoingPods, role) : this.PODtoTable(this.props._this.state.incomingPods, role) }
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    )
  }
  
  render(){
    return(
      <Modal
        centered
        style={{ marginTop: 10 }}
        title={'Details'}
        width={'50vw'}
        visible={this.props._this.state.showDetails}
        onCancel={() => {this.props._this.setState({showDetails: false}); this.setState({currentTab: '1'})}}
        bodyStyle={{paddingTop: 0}}
        footer={null}
        destroyOnClose
      >
        <Tabs activeKey={this.state.currentTab} onChange={key => this.setState({currentTab: key})}>
          <Tabs.TabPane tab={<span><InfoCircleOutlined />General</span>} key={'1'}>
            <div style={{minHeight: '40vh'}}>
              <Space direction={'vertical'}>
                <div>
                  { this.props.client ? (
                    <Badge text={
                      <>
                        Using
                        <> </>
                        <Tag style={{marginRight: 3}}>{this.props.foreignCluster.spec.clusterID}</Tag>
                        's resources.
                      </>
                    }
                           status={'processing'}
                    />
                  ) : null }
                </div>
                <div>
                  { this.props.server ? (
                    <Badge text={
                      <>
                        <Tag style={{marginRight: 3}}>{this.props.foreignCluster.spec.clusterID}</Tag>
                        <> </>
                        is using your resources.
                      </>
                    }
                           status={'processing'}
                    />
                  ) : null }
                </div>
              </Space>
            </div>
          </Tabs.TabPane>
          { this.props.server ? (
            <Tabs.TabPane tab={<span><HomeOutlined />Home</span>} key={'2'}>
              {this.getUsedResources(true)}
            </Tabs.TabPane>
          ) : null }
          { this.props.client ? (
            <Tabs.TabPane tab={<span><GlobalOutlined />Foreign</span>} key={'3'}>
              {this.getUsedResources(false)}
            </Tabs.TabPane>
          ) : null }
        </Tabs>
      </Modal>
    )
  }
}

export default ConnectionDetails;
