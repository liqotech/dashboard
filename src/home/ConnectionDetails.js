import React, { Component } from 'react';
import {
  Modal, Tabs, Typography, Tag, Badge, Space,
  Row, Col, Card, Progress, Input, Button, Table, Tooltip
} from 'antd';
import InfoCircleOutlined from '@ant-design/icons/lib/icons/InfoCircleOutlined';
import HomeOutlined from '@ant-design/icons/lib/icons/HomeOutlined';
import GlobalOutlined from '@ant-design/icons/lib/icons/GlobalOutlined';
import { getColor } from './HomeUtils';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';
import ExclamationCircleTwoTone from '@ant-design/icons/lib/icons/ExclamationCircleTwoTone';

const n = Math.pow(10, 6);

class ConnectionDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: '1',
    }
  }

  getUsedTotalCPU(role){
    if(!role)
      return this.props.outgoingTotalPercentage.CPU;
    else
      return this.props.incomingTotalPercentage.CPU;
  }

  getUsedTotalRAM(role){
    if(!role)
      return this.props.outgoingTotalPercentage.RAM;
    else
      return this.props.incomingTotalPercentage.RAM;
  }

  PODtoTable(pods, role){

    let searchText = '';
    let searchedColumn = '';

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
      confirm();
      searchText = selectedKeys[0];
      searchedColumn = dataIndex;
    };

    const handleReset = clearFilters => {
      clearFilters();
      searchText = '' ;
    };

    const getColumnSearchProps = dataIndex => ({
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            ref={node => {
              searchText = node;
            }}
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
              Reset
            </Button>
          </Space>
        </div>
      ),
      filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
      onFilter: (value, record) =>
        record[dataIndex] ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()) : '',
      onFilterDropdownVisibleChange: visible => {
        if (visible) {
          setTimeout(() => searchText.select());
        }
      },
      render: text =>
        dataIndex === 'Status' ? (
          text === 'Running' ? <Tag color={'blue'}>{text}</Tag> : <Tag color={'red'}>{text}</Tag>
        ) : (
          dataIndex === 'Namespace' ? (
            <Tooltip title={text}>
              <Tag style={{ maxWidth: '5vw', overflow: 'hidden', textOverflow: 'ellipsis'}}>{text}</Tag>
            </Tooltip>
          ) : text
        ),
    });

    const column = [
      {
        title: 'Name',
        dataIndex: 'Name',
        key: 'Name',
        ...getColumnSearchProps('Name')
      },
      {
        title: 'Status',
        dataIndex: 'Status',
        key: 'Status',
        ...getColumnSearchProps('Status')
      },
      {
        title: 'CPU (%)',
        dataIndex: 'CPU',
        key: 'CPU',
        render: text =>
            <Progress percent={text}
                      status={'active'}
                      strokeColor={getColor(text)}
            />,
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
                        strokeColor={getColor(text)}
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
        ...getColumnSearchProps('Namespace')
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
             pagination={{ size: 'small', position: ['bottomCenter'], pageSize: 11 }} />
    )
  }

  /**
   * Get and show the used resources for a connection
   * @role: can be home or foreign
   */
  getUsedResources(role) {
    const totalCPU = this.getUsedTotalCPU(role);
    const totalRAM = this.getUsedTotalRAM(role);

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
                <Row gutter={[20, 20]} align={'center'} justify={'center'}>
                  <Col>
                    <Row justify={'center'}>
                      <Typography.Text strong>CPU</Typography.Text>
                    </Row>
                    <Row justify={'center'}>
                      <Progress type={'dashboard'} percent={totalCPU}
                                strokeColor={getColor(totalCPU)}
                      />
                    </Row>
                  </Col>
                </Row>
                <Row gutter={[20, 20]} align={'center'} justify={'center'}>
                  <Col>
                    <Row justify={'center'}>
                      <Typography.Text strong>RAM</Typography.Text>
                    </Row>
                    <Row justify={'center'}>
                      <Progress type={'dashboard'} percent={totalRAM}
                                strokeColor={getColor(totalRAM)}
                      />
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col flex={23}>
              <Card title={ !role ? 'Outgoing PODs' : 'Incoming PODs'}
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
