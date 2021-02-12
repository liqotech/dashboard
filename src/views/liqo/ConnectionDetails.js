import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  Typography,
  Tag,
  Badge,
  Space,
  Statistic,
  Row,
  Col,
  Card,
  Progress,
  Table,
  Tooltip,
  Divider
} from 'antd';
import InfoCircleOutlined from '@ant-design/icons/lib/icons/InfoCircleOutlined';
import HomeOutlined from '@ant-design/icons/lib/icons/HomeOutlined';
import GlobalOutlined from '@ant-design/icons/lib/icons/GlobalOutlined';
import { getColor } from './HomeUtils';
import ExclamationCircleOutlined from '@ant-design/icons/lib/icons/ExclamationCircleOutlined';
import { getColumnSearchProps } from '../../services/TableUtils';

const n = Math.pow(10, 6);

function ConnectionDetails(props) {
  const foreignClusterName =
    props.foreignCluster.spec.clusterIdentity.clusterName;
  const foreignClusterID = props.foreignCluster.spec.clusterIdentity.clusterID;
  const [currentTab, setCurrentTab] = useState('1');

  const getUsedTotal = role => {
    if (!role) return props.outgoingTotal;
    else return props.incomingTotal;
  };

  const PODtoTable = (pods, role) => {
    const renderPODs = (text, record, dataIndex) => {
      let podNoRes = role
        ? props.incomingPodsPercentage.find(pod => {
            return text === pod.name;
          })
        : props.outgoingPodsPercentage.find(pod => {
            return text === pod.name;
          });

      return dataIndex === 'Status' ? (
        text === 'Running' ? (
          <Tag color={'blue'}>{text}</Tag>
        ) : (
          <Tag color={'red'}>{text}</Tag>
        )
      ) : dataIndex === 'Namespace' ? (
        <Tooltip title={text}>
          <Tag
            style={{
              maxWidth: '5vw',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {text}
          </Tag>
        </Tooltip>
      ) : (
        <Row>
          <Col>
            <Tooltip title={text}>
              <div
                style={{
                  maxWidth: '10vw',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {text}
              </div>
            </Tooltip>
          </Col>
          {podNoRes && !podNoRes.resourcesRequestsPresent ? (
            <Col>
              <Tooltip title={"POD doesn't have a resource limit"}>
                <ExclamationCircleOutlined
                  style={{ marginLeft: 4, color: '#ff4d4f' }}
                />
              </Tooltip>
            </Col>
          ) : null}
        </Row>
      );
    };

    const column = [
      {
        dataIndex: 'Name',
        key: 'Name',
        title: <div style={{ marginLeft: '2em' }}>Name</div>,
        ...getColumnSearchProps('Name', renderPODs)
      },
      {
        dataIndex: 'Status',
        key: 'Status',
        title: <div style={{ marginLeft: '2em' }}>Status</div>,
        ...getColumnSearchProps('Status', renderPODs)
      },
      {
        title: 'CPU (%)',
        dataIndex: 'CPU',
        key: 'CPU',
        render: (text, record) => {
          let podCPUmb = role
            ? props.incomingPodsPercentage.find(pod => {
                return record.key === pod.name;
              })
              ? props.incomingPodsPercentage.find(pod => {
                  return record.key === pod.name;
                }).CPUmi / n
              : 0
            : props.outgoingPodsPercentage.find(pod => {
                return record.key === pod.name;
              })
            ? props.outgoingPodsPercentage.find(pod => {
                return record.key === pod.name;
              }).CPUmi / n
            : 0;

          return (
            <Tooltip title={podCPUmb + 'm'}>
              <Progress
                percent={text}
                status={'active'}
                strokeColor={getColor(text, 0)}
              />
            </Tooltip>
          );
        },
        sorter: {
          compare: (a, b) => a.CPU - b.CPU
        }
      },
      {
        title: 'RAM (%)',
        dataIndex: 'RAM',
        key: 'RAM',
        render: (text, record) => {
          let podRAMmb = role
            ? props.incomingPodsPercentage.find(pod => {
                return record.key === pod.name;
              })
              ? props.incomingPodsPercentage.find(pod => {
                  return record.key === pod.name;
                }).RAMmi / n
              : 0
            : props.outgoingPodsPercentage.find(pod => {
                return record.key === pod.name;
              })
            ? props.outgoingPodsPercentage.find(pod => {
                return record.key === pod.name;
              }).RAMmi / n
            : 0;

          return (
            <Tooltip title={podRAMmb + 'Mi'}>
              <Progress
                percent={text}
                status={'active'}
                strokeColor={getColor(text, 0)}
              />
            </Tooltip>
          );
        },
        sorter: {
          compare: (a, b) => a.RAM - b.RAM
        }
      },
      {
        dataIndex: 'Namespace',
        key: 'Namespace',
        title: <div style={{ marginLeft: '2em' }}>Namespace</div>,
        ...getColumnSearchProps('Namespace', renderPODs)
      }
    ];

    const data = [];

    pods.forEach(po => {
      const pod = role
        ? props.incomingPodsPercentage.find(pod => {
            return po.metadata.name === pod.name;
          })
        : props.outgoingPodsPercentage.find(pod => {
            return po.metadata.name === pod.name;
          });

      data.push({
        key: po.metadata.name,
        Name: po.metadata.name,
        Status: po.status.phase,
        CPU: pod ? pod.CPU : 0,
        RAM: pod ? pod.RAM : 0,
        Namespace: po.metadata.namespace
      });
    });

    return (
      <Table
        size={'small'}
        columns={column}
        dataSource={data}
        pagination={{ size: 'small', position: ['bottomCenter'], pageSize: 13 }}
      />
    );
  };

  /**
   * Get and show the used resources for a connection
   * @role: can be home or foreign
   */
  const getUsedResources = role => {
    const total = getUsedTotal(role);

    let reserved = {
      CPU: (
        total.available.CPU *
        (total.availablePercentage.CPU / 100)
      ).toFixed(2),
      RAM: (
        total.available.RAM *
        (total.availablePercentage.RAM / 100)
      ).toFixed(2)
    };

    return (
      <div>
        <div style={{ marginTop: 10 }}>
          <Row>
            <Col flex={1}>
              <Card
                title={'Resources Used'}
                style={{ marginRight: 20 }}
                extra={
                  role ? (
                    props.metricsNotAvailableIncoming ? (
                      <Tooltip
                        title={'Precise metrics not available in your cluster'}
                      >
                        <ExclamationCircleOutlined
                          style={{ color: '#ff4d4f' }}
                        />
                      </Tooltip>
                    ) : null
                  ) : props.metricsNotAvailableOutgoing ? (
                    <Tooltip
                      title={'Precise metrics not available in this cluster'}
                    >
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    </Tooltip>
                  ) : null
                }
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
                        format={totPercent => (
                          <Progress
                            type={'dashboard'}
                            percent={total.percentage.CPU}
                            strokeColor={getColor(total.percentage.CPU, 0)}
                            format={percent => (
                              <div>
                                <div>
                                  <Tooltip
                                    title={'Consumed'}
                                    placement={'right'}
                                  >
                                    <Typography.Text>
                                      {percent + '%'}
                                    </Typography.Text>
                                  </Tooltip>
                                </div>
                                <div>
                                  <Tooltip
                                    title={'Reserved'}
                                    placement={'right'}
                                  >
                                    <Typography.Text
                                      type={'secondary'}
                                      style={{ fontSize: '0.7em' }}
                                    >
                                      {totPercent + '%'}
                                    </Typography.Text>
                                  </Tooltip>
                                </div>
                              </div>
                            )}
                          />
                        )}
                      />
                    </Row>
                    <Row>
                      <Statistic
                        title={
                          <div>
                            <Badge color={getColor(total.percentage.CPU, 0)} />{' '}
                            Consumed
                          </div>
                        }
                        value={Math.round(total.consumed.CPU / n) + 'm'}
                        suffix={
                          '/ ' + Math.round(total.available.CPU / n) + 'm'
                        }
                      />
                    </Row>
                    <Row>
                      <Statistic
                        title={
                          <div>
                            <Badge
                              color={getColor(total.availablePercentage.CPU, 1)}
                            />{' '}
                            Reserved
                          </div>
                        }
                        value={Math.round(reserved.CPU / n) + 'm'}
                        suffix={
                          '/ ' + Math.round(total.available.CPU / n) + 'm'
                        }
                      />
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
                        format={totPercent => (
                          <Progress
                            type={'dashboard'}
                            percent={total.percentage.RAM}
                            strokeColor={getColor(total.percentage.RAM, 0)}
                            format={percent => (
                              <div>
                                <div>
                                  <Tooltip
                                    title={'Consumed'}
                                    placement={'right'}
                                  >
                                    <Typography.Text>
                                      {percent + '%'}
                                    </Typography.Text>
                                  </Tooltip>
                                </div>
                                <div>
                                  <Tooltip
                                    title={'Reserved'}
                                    placement={'right'}
                                  >
                                    <Typography.Text
                                      type={'secondary'}
                                      style={{ fontSize: '0.7em' }}
                                    >
                                      {totPercent + '%'}
                                    </Typography.Text>
                                  </Tooltip>
                                </div>
                              </div>
                            )}
                          />
                        )}
                      />
                    </Row>
                    <Row>
                      <Statistic
                        title={
                          <div>
                            <Badge color={getColor(total.percentage.RAM, 0)} />{' '}
                            Consumed
                          </div>
                        }
                        value={Math.round(total.consumed.RAM / n) + 'Mi'}
                        suffix={
                          '/ ' + Math.round(total.available.RAM / n) + 'Mi'
                        }
                      />
                    </Row>
                    <Row>
                      <Statistic
                        title={
                          <div>
                            <Badge
                              color={getColor(total.availablePercentage.RAM, 1)}
                            />{' '}
                            Reserved
                          </div>
                        }
                        value={Math.round(reserved.RAM / n) + 'Mi'}
                        suffix={
                          '/ ' + Math.round(total.available.RAM / n) + 'Mi'
                        }
                      />
                    </Row>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col flex={23}>
              <Card
                title={
                  !role ? (
                    <div>
                      Outgoing PODs{' '}
                      <Typography.Text type={'secondary'}>
                        (your offloaded PODs)
                      </Typography.Text>
                    </div>
                  ) : (
                    <div>
                      Incoming PODs{' '}
                      <Typography.Text type={'secondary'}>
                        (foreign hosted PODs)
                      </Typography.Text>
                    </div>
                  )
                }
                bodyStyle={{ padding: 0 }}
              >
                {!role
                  ? PODtoTable(props.outgoingPods, role)
                  : PODtoTable(props.incomingPods, role)}
              </Card>
            </Col>
          </Row>
        </div>
      </div>
    );
  };

  return (
    <Modal
      centered
      style={{ marginTop: 10 }}
      title={'Details'}
      width={'50vw'}
      visible={props.showDetails}
      onCancel={() => {
        props.setShowDetails(false);
        setCurrentTab('1');
      }}
      bodyStyle={{ paddingTop: 0 }}
      footer={null}
      destroyOnClose
    >
      <Tabs activeKey={currentTab} onChange={key => setCurrentTab(key)}>
        <Tabs.TabPane
          tab={
            <span>
              <InfoCircleOutlined />
              General
            </span>
          }
          key={'1'}
        >
          <div style={{ minHeight: '40vh' }}>
            <Space direction={'vertical'}>
              <div>
                {props.client ? (
                  <Badge
                    text={
                      <>
                        Using
                        <> </>
                        <Tag style={{ marginRight: 3 }}>
                          {foreignClusterName
                            ? foreignClusterName
                            : foreignClusterID}
                        </Tag>
                        's resources.
                      </>
                    }
                    status={'processing'}
                  />
                ) : null}
              </div>
              <div>
                {props.server ? (
                  <Badge
                    text={
                      <>
                        <Tag style={{ marginRight: 3 }}>
                          {foreignClusterName
                            ? foreignClusterName
                            : foreignClusterID}
                        </Tag>
                        <> </>
                        is using your resources.
                      </>
                    }
                    status={'processing'}
                  />
                ) : null}
              </div>
            </Space>
          </div>
        </Tabs.TabPane>
        {props.server ? (
          <Tabs.TabPane
            tab={
              <span>
                <HomeOutlined />
                Home
              </span>
            }
            key={'2'}
          >
            {getUsedResources(true)}
          </Tabs.TabPane>
        ) : null}
        {props.client ? (
          <Tabs.TabPane
            tab={
              <span>
                <GlobalOutlined />
                Foreign
              </span>
            }
            key={'3'}
          >
            {getUsedResources(false)}
          </Tabs.TabPane>
        ) : null}
      </Tabs>
    </Modal>
  );
}

export default ConnectionDetails;
