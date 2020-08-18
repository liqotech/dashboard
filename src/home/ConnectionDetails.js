import React, { Component } from 'react';
import {
  Modal, Tabs, Typography, Tag, Badge, Space,
  Row, Col, Card, Progress, Input, Button, Table
} from 'antd';
import InfoCircleOutlined from '@ant-design/icons/lib/icons/InfoCircleOutlined';
import HomeOutlined from '@ant-design/icons/lib/icons/HomeOutlined';
import GlobalOutlined from '@ant-design/icons/lib/icons/GlobalOutlined';
import { getColor } from './HomeUtils';
import SearchOutlined from '@ant-design/icons/lib/icons/SearchOutlined';

class ConnectionDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTab: '1'
    }
  }

  getUsedPODCPU(role){
    //TODO: retrieve pod CPU consumption percentage
    return 10;
  }

  getUsedPODRAM(role){
    //TODO: retrieve pod RAM consumption percentage
    return 10;
  }

  getUsedPODStorage(role){
    //TODO: retrieve pod Storage consumption percentage
    return 10;
  }

  getUsedTotalCPU(role){
    //TODO: retrieve pods total CPU consumption percentage
    return 90;
  }

  getUsedTotalRAM(role){
    //TODO: retrieve pods total RAM consumption percentage
    return 20;
  }

  getUsedTotalStorage(role){
    //TODO: retrieve pods total Storage consumption percentage
    return 75;
  }

  PODtoTable(pods){

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
          text
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
        render: text => <Progress percent={text}
                                  status={'active'}
                                  strokeColor={getColor(text)}
        />,
        sorter: {
          compare: (a, b) => a.CPU - b.CPU
        },
      },
      {
        title: 'RAM (MB)',
        dataIndex: 'RAM',
        key: 'RAM',
        render: text => <Progress percent={(text/999)*100}
                                  status={'active'}
                                  format={() => text}
                                  strokeColor={getColor((text/999)*100)}
        />,
        sorter: {
          compare: (a, b) => a.RAM - b.RAM
        },
      },
      {
        title: 'Storage (MB)',
        dataIndex: 'Storage',
        key: 'Storage',
        render: text => <Progress percent={(text/999)*100}
                                  status={'active'}
                                  format={() => text}
                                  strokeColor={getColor((text/999)*100)}
        />,
        sorter: {
          compare: (a, b) => a.Storage - b.Storage
        },
      },
    ];

    const data = [];

    pods.forEach(po => {
      data.push(
        {
          key: po.metadata.name,
          Name: po.metadata.name,
          Status: po.status.phase,
          CPU: this.getUsedPODCPU(),
          RAM: this.getUsedPODRAM(),
          Storage: this.getUsedPODStorage()
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
    const totalStorage = this.getUsedTotalStorage(role);

    return(
      <div>
        <div style={{marginTop: 10}}>
          <Row>
            <Col flex={1}>
              <Card title={'Resources Used'} style={{marginRight: 20}}>
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
                <Row gutter={[20, 20]} align={'center'} justify={'center'}>
                  <Col>
                    <Row justify={'center'}>
                      <Typography.Text strong>Storage</Typography.Text>
                    </Row>
                    <Row justify={'center'}>
                      <Progress type={'dashboard'} percent={totalStorage}
                                strokeColor={getColor(totalStorage)}
                      />
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col flex={23}>
              <Card title={ role === 'foreign' ? 'Outgoing PODs' : 'Incoming PODs'}
                    bodyStyle={{padding: 0}}
              >
                { role === 'foreign' ? this.PODtoTable(this.props._this.state.outgoingPods) : this.PODtoTable(this.props._this.state.incomingPods) }
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
              {this.getUsedResources('home')}
            </Tabs.TabPane>
          ) : null }
          { this.props.client ? (
            <Tabs.TabPane tab={<span><GlobalOutlined />Foreign</span>} key={'3'}>
              {this.getUsedResources('foreign')}
            </Tabs.TabPane>
          ) : null }
        </Tabs>
      </Modal>
    )
  }
}

export default ConnectionDetails;
