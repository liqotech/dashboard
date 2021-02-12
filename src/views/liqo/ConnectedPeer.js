import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Button,
  Col,
  Collapse,
  Dropdown,
  Menu,
  Progress,
  Row,
  Space,
  Tag,
  Tooltip,
  Typography
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
import {
  convertCPU,
  convertRAM,
  getColor,
  updatePeeringStatus
} from './HomeUtils';
import { getPeerProperties } from './PeerProperties';
import ConnectionDetails from './ConnectionDetails';

function ConnectedPeer(props) {
  /**
   * @loading: if is connecting
   * @backgroundColor: if selected
   */
  const foreignClusterName =
    props.foreignCluster.spec.clusterIdentity.clusterName;
  const foreignClusterID = props.foreignCluster.spec.clusterIdentity.clusterID;

  const [loading, setLoading] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('white');
  const [showProperties, setShowProperties] = useState(false);
  let incomingPods = useRef([]);
  const [incomingPodsPercentage, setIncomingPodsPercentage] = useState([]);
  const [incomingTotal, setIncomingTotal] = useState({
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
  });
  let outgoingPods = useRef([]);
  const [outgoingPodsPercentage, setOutgoingPodsPercentage] = useState([]);
  const [outgoingTotal, setOutgoingTotal] = useState({
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
  });
  const [showDetails, setShowDetails] = useState(false);
  const [sharing, setSharing] = useState({
    server: false,
    client: false
  });

  let metricsNotAvailableIncoming = useRef(false);
  let metricsNotAvailableOutgoing = useRef(false);

  useEffect(() => {
    window.api
      .getMetricsNodes()
      .then(res => {
        /** That means there are no metrics available */
        if (res.items.length === 0) {
          metricsNotAvailableIncoming.current = true;
          metricsNotAvailableOutgoing.current = true;
        } else {
          /** That means there are no metrics available from the virtual node */
          if (
            res.items.filter(no => {
              return no.metadata.name.slice(0, 5) === 'liqo-';
            }).length !== 0
          )
            metricsNotAvailableOutgoing.current = true;
        }
      })
      .catch(() => {
        metricsNotAvailableIncoming.current = true;
        metricsNotAvailableOutgoing.current = true;
      });
  }, []);

  useEffect(() => {
    /**
     * Every 30 seconds the metrics are retrieved and the view updated
     */
    let interval = setInterval(() => {
      updatePODPercentage();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    props.updateFCMetrics(true, {
      fc: foreignClusterName ? foreignClusterName : foreignClusterID,
      RAM: incomingTotal.consumed.RAM,
      CPU: incomingTotal.consumed.CPU
    });
  }, [incomingTotal]);

  useEffect(() => {
    props.updateFCMetrics(false, {
      fc: foreignClusterName ? foreignClusterName : foreignClusterID,
      RAM: outgoingTotal.consumed.RAM,
      CPU: outgoingTotal.consumed.CPU
    });
  }, [outgoingTotal]);

  useEffect(() => {
    if (props.client) {
      getClientPODs();
    }

    if (props.server) {
      getServerPODs();
    }
  }, [props.incomingPods, props.outgoingPods]);

  const getPODPercentage = (po, res) => {
    let allocatableCPU = 0;
    let allocatableRAM = 0;
    let usedCPU = 0;
    let usedRAM = 0;
    let resourcesRequestsPresent = 0;
    po.spec.containers.forEach(co => {
      if (
        co.resources.requests &&
        co.resources.requests.cpu &&
        co.resources.requests.memory
      ) {
        resourcesRequestsPresent++;
        allocatableCPU += convertCPU(co.resources.requests.cpu);
        allocatableRAM += convertRAM(co.resources.requests.memory);
      }
    });

    if (res === 404) {
      usedCPU = allocatableCPU;
      usedRAM = allocatableRAM;
    } else {
      res.containers.forEach(co => {
        usedCPU += convertCPU(co.usage.cpu);
        usedRAM += convertRAM(co.usage.memory);
      });
      if (resourcesRequestsPresent !== po.spec.containers.length) {
        allocatableRAM = usedRAM;
        allocatableCPU = usedCPU;
      }
    }

    return {
      name: po.metadata.name,
      CPU:
        resourcesRequestsPresent === po.spec.containers.length
          ? Math.round((usedCPU / allocatableCPU) * 100 * 10) / 10
          : 0,
      RAM:
        resourcesRequestsPresent === po.spec.containers.length
          ? Math.round((usedRAM / allocatableRAM) * 100 * 10) / 10
          : 0,
      RAMmi: Math.round(usedRAM * 10) / 10,
      CPUmi: Math.round(usedCPU * 10) / 10,
      CPUTot:
        resourcesRequestsPresent === po.spec.containers.length
          ? Math.round(allocatableCPU * 10) / 10
          : 0,
      RAMTot:
        resourcesRequestsPresent === po.spec.containers.length
          ? Math.round(allocatableRAM * 10) / 10
          : 0,
      resourcesRequestsPresent:
        resourcesRequestsPresent === po.spec.containers.length
    };
  };

  const calculateIncomingMetricsPods = (home, po, res) => {
    let podPercentage = getPODPercentage(po, res);

    home.podsPercentage.push(podPercentage);

    home.totalPodsRAM += podPercentage.RAMmi;
    home.totalPodsCPU += podPercentage.CPUmi;

    home.totalAllocatablePodsRAM += podPercentage.RAMTot;
    home.totalAllocatablePodsCPU += podPercentage.CPUTot;

    let totalRAMPercentage =
      (home.totalPodsRAM /
        ((home.totalMemory *
          props.config.spec.advertisementConfig.outgoingConfig
            .resourceSharingPercentage) /
          100)) *
      100;
    let totalCPUPercentage =
      (home.totalPodsCPU /
        ((home.totalCPU *
          props.config.spec.advertisementConfig.outgoingConfig
            .resourceSharingPercentage) /
          100)) *
      100;

    let totalAvailableRAMPercentage =
      (home.totalAllocatablePodsRAM /
        ((home.totalMemory *
          props.config.spec.advertisementConfig.outgoingConfig
            .resourceSharingPercentage) /
          100)) *
      100;
    let totalAvailableCPUPercentage =
      (home.totalAllocatablePodsCPU /
        ((home.totalCPU *
          props.config.spec.advertisementConfig.outgoingConfig
            .resourceSharingPercentage) /
          100)) *
      100;

    if (home.counter === incomingPods.current.length) {
      setIncomingPodsPercentage(home.podsPercentage);
      setIncomingTotal({
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
          RAM:
            (home.totalMemory *
              props.config.spec.advertisementConfig.outgoingConfig
                .resourceSharingPercentage) /
            100,
          CPU:
            (home.totalCPU *
              props.config.spec.advertisementConfig.outgoingConfig
                .resourceSharingPercentage) /
            100
        }
      });
    }

    return home;
  };

  const calculateOutgoingMetricsPods = (foreign, po, res) => {
    let podPercentage = getPODPercentage(po, res);

    foreign.podsPercentage.push(podPercentage);

    foreign.totalPodsRAM += podPercentage.RAMmi;
    foreign.totalPodsCPU += podPercentage.CPUmi;

    foreign.totalAllocatablePodsRAM += podPercentage.RAMTot;
    foreign.totalAllocatablePodsCPU += podPercentage.CPUTot;

    let totalRAMPercentage = (foreign.totalPodsRAM / foreign.totalMemory) * 100;
    let totalCPUPercentage = (foreign.totalPodsCPU / foreign.totalCPU) * 100;

    let totalAvailableRAMPercentage =
      (foreign.totalAllocatablePodsRAM / foreign.totalMemory) * 100;
    let totalAvailableCPUPercentage =
      (foreign.totalAllocatablePodsCPU / foreign.totalCPU) * 100;

    if (foreign.counter === outgoingPods.current.length) {
      setOutgoingPodsPercentage(foreign.podsPercentage);
      setOutgoingTotal({
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
      });
    }

    return foreign;
  };

  const updatePODPercentage = () => {
    if (props.server) {
      let home = {
        podsPercentage: [],
        totalMemory: 0,
        totalCPU: 0,
        totalPodsRAM: 0,
        totalPodsCPU: 0,
        totalAllocatablePodsRAM: 0,
        totalAllocatablePodsCPU: 0,
        counter: 0
      };
      props.homeNodes.forEach(no => {
        home.totalMemory += convertRAM(no.status.allocatable.memory);
        home.totalCPU += convertCPU(no.status.allocatable.cpu);
      });
      if (incomingPods.current.length === 0) {
        setIncomingPodsPercentage([]);
        setIncomingTotal({
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
            RAM:
              (home.totalMemory *
                props.config.spec.advertisementConfig.outgoingConfig
                  .resourceSharingPercentage) /
              100,
            CPU:
              (home.totalCPU *
                props.config.spec.advertisementConfig.outgoingConfig
                  .resourceSharingPercentage) /
              100
          }
        });
      } else {
        incomingPods.current.forEach(po => {
          window.api
            .getMetricsPOD(po.metadata.namespace, po.metadata.name)
            .then(res => {
              metricsNotAvailableIncoming.current = false;
              home.counter++;
              let total = calculateIncomingMetricsPods(home, po, res);
              home.totalPodsRAM = total.totalPodsRAM;
              home.totalPodsCPU = total.totalPodsCPU;
            })
            .catch(error => {
              metricsNotAvailableIncoming.current = true;
              home.counter++;
              let total = calculateIncomingMetricsPods(home, po, 404);
              home.totalPodsRAM = total.totalPodsRAM;
              home.totalPodsCPU = total.totalPodsCPU;
            });
        });
      }
    }

    if (props.client) {
      let foreign = {
        podsPercentage: [],
        totalMemory: 0,
        totalCPU: 0,
        totalPodsRAM: 0,
        totalPodsCPU: 0,
        totalAllocatablePodsRAM: 0,
        totalAllocatablePodsCPU: 0,
        counter: 0
      };

      let adv = props.advertisements.find(adv => {
        return (
          adv.metadata.name ===
          props.foreignCluster.status.outgoing.advertisement.name
        );
      });

      foreign.totalMemory = convertRAM(adv.spec.resourceQuota.hard.memory);
      foreign.totalCPU = convertCPU(adv.spec.resourceQuota.hard.cpu);

      if (outgoingPods.current.length === 0) {
        setOutgoingPodsPercentage([]);
        setOutgoingTotal({
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
            RAM: foreign.totalMemory,
            CPU: foreign.totalCPU
          }
        });
      } else {
        outgoingPods.current.forEach(po => {
          window.api
            .getMetricsPOD(po.metadata.namespace, po.metadata.name)
            .then(res => {
              metricsNotAvailableOutgoing.current = false;
              foreign.counter++;
              let total = calculateOutgoingMetricsPods(foreign, po, res);
              foreign.totalPodsRAM = total.totalPodsRAM;
              foreign.totalPodsCPU = total.totalPodsCPU;
            })
            .catch(error => {
              metricsNotAvailableOutgoing.current = true;
              foreign.counter++;
              let total = calculateOutgoingMetricsPods(foreign, po, 404);
              foreign.totalPodsRAM = total.totalPodsRAM;
              foreign.totalPodsCPU = total.totalPodsCPU;
            });
        });
      }
    }
  };

  /**
   * Search for pods offloaded to the foreign cluster
   */
  const getClientPODs = () => {
    let vNode = props.advertisements.find(adv => {
      return (
        adv.metadata.name ===
        props.foreignCluster.status.outgoing.advertisement.name
      );
    }).status.vnodeReference.name;

    outgoingPods.current = props.outgoingPods.filter(po => {
      return po.spec.nodeName === vNode;
    });
    sharing.client = outgoingPods.current.length !== 0;
    updatePODPercentage();
  };

  /**
   * Search for pods offloaded to the home cluster from a foreign one
   */
  const getServerPODs = () => {
    let vNode =
      'liqo-' +
      props.foreignCluster.status.outgoing['remote-peering-request-name'];
    incomingPods.current = props.incomingPods.filter(po => {
      try {
        return po.metadata.annotations.home_nodename === vNode;
      } catch {
        return false;
      }
    });
    sharing.server = incomingPods.current.length !== 0;
    updatePODPercentage();
  };

  const clientPercentage = () => {
    return outgoingTotal.percentage.RAM;
  };

  const serverPercentage = () => {
    return incomingTotal.percentage.RAM;
  };

  /** Disconnect from peer (it makes foreignCluster's spec join parameter false) */
  const disconnect = () => {
    props.foreignCluster.spec.join = false;

    updatePeeringStatus(
      props,
      loading,
      setLoading,
      'Disconnected from ' + props.foreignCluster.metadata.name,
      'Could not disconnect'
    );
  };

  const menu = (
    <Menu>
      <Menu.Item
        key={'details'}
        icon={<SnippetsOutlined />}
        onClick={() => {
          setShowDetails(true);
        }}
      >
        Details
      </Menu.Item>
      <Menu.Item
        key={'properties'}
        icon={<ToolOutlined />}
        onClick={() => {
          setShowProperties(true);
        }}
      >
        Properties
      </Menu.Item>
      <Menu.Item key={'rules'} icon={<AuditOutlined />}>
        Rules
      </Menu.Item>
      <Menu.Item
        danger
        key={'disconnect'}
        icon={<CloseOutlined />}
        onClick={() => {
          disconnect();
        }}
      >
        Disconnect
      </Menu.Item>
    </Menu>
  );

  /** Quantity of available resources I am using on you */
  let clientPercent = 0;

  if (props.client) clientPercent = clientPercentage();

  /** Quantity of available resources you are using on me */
  let serverPercent = 0;

  if (props.server) serverPercent = serverPercentage();

  return (
    <div style={{ paddingTop: '1em', paddingBottom: '1em' }}>
      <Collapse accordion bordered={false}>
        <Collapse.Panel
          header={
            <>
              <Space size={'middle'}>
                <div>
                  <Tooltip
                    title={
                      <div>
                        You {props.server ? ': ' + serverPercent + '%' : null}
                      </div>
                    }
                    placement={'top'}
                  >
                    <Progress
                      width={54}
                      type="circle"
                      percent={serverPercent}
                      strokeWidth={10}
                      trailColor={
                        props.server && (sharing.client || sharing.server)
                          ? null
                          : backgroundColor
                      }
                      strokeColor={
                        props.server && (sharing.client || sharing.server)
                          ? getColor(serverPercent)
                          : backgroundColor
                      }
                      format={() => (
                        <Avatar
                          size="large"
                          style={
                            sharing.client || sharing.server
                              ? { backgroundColor: '#1890ff' }
                              : { backgroundColor: '#ccc' }
                          }
                          icon={<UserOutlined />}
                        />
                      )}
                    />
                  </Tooltip>
                </div>
                {props.client && props.server ? (
                  <SwapOutlined style={{ fontSize: '2em' }} />
                ) : props.client ? (
                  <SwapRightOutlined style={{ fontSize: '2em' }} />
                ) : (
                  <SwapLeftOutlined style={{ fontSize: '2em' }} />
                )}
                <div>
                  <Tooltip
                    title={props.client ? clientPercent + '%' : null}
                    placement={'top'}
                  >
                    <Progress
                      width={54}
                      type="circle"
                      percent={clientPercent}
                      strokeWidth={10}
                      trailColor={
                        props.client && (sharing.client || sharing.server)
                          ? null
                          : backgroundColor
                      }
                      strokeColor={
                        props.client && (sharing.client || sharing.server)
                          ? getColor(clientPercent)
                          : backgroundColor
                      }
                      format={() => (
                        <Avatar
                          size="large"
                          style={
                            sharing.client || sharing.server
                              ? { backgroundColor: '#1890ff' }
                              : { backgroundColor: '#ccc' }
                          }
                          icon={<ClusterOutlined />}
                        />
                      )}
                    />
                  </Tooltip>
                </div>
                <Tooltip placement={'top'} title={foreignClusterID}>
                  <Tag
                    style={{
                      maxWidth: '10vw',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    color="blue"
                  >
                    {foreignClusterName ? foreignClusterName : foreignClusterID}
                  </Tag>
                </Tooltip>
              </Space>
            </>
          }
          extra={
            <div
              aria-label={'dropdown-connected'}
              onClick={event => {
                event.stopPropagation();
              }}
            >
              <Dropdown.Button
                overlay={menu}
                trigger={['click']}
                icon={<EllipsisOutlined />}
              />
            </div>
          }
          showArrow={false}
          key={props.foreignCluster.metadata.name + '_connected'}
          style={{ border: 0 }}
        >
          <div style={{ paddingLeft: '1em', paddingBottom: '1em' }}>
            <Row align={'middle'}>
              <Col flex={2}>
                <Typography.Text type={'secondary'}>
                  {'Connected on ' + props.foreignCluster.spec.discoveryType}
                  {sharing.client || sharing.server
                    ? ', sharing'
                    : ', not sharing'}
                </Typography.Text>
              </Col>
              <Col flex={3}>
                <div style={{ float: 'right' }}>
                  <Button
                    style={{ marginRight: '1em' }}
                    onClick={() => {
                      setShowProperties(true);
                    }}
                  >
                    Properties
                  </Button>
                  <Button type={'danger'} onClick={() => disconnect()}>
                    Disconnect
                  </Button>
                </div>
              </Col>
            </Row>
          </div>
        </Collapse.Panel>
      </Collapse>

      {/** This modal shows the properties of the clusters */}
      {getPeerProperties(
        props.client,
        props.server,
        props,
        showProperties,
        setShowProperties
      )}

      {/** This modal shows the detail of the connection */}
      <ConnectionDetails
        {...props}
        showDetails={showDetails}
        setShowDetails={setShowDetails}
        metricsNotAvailableIncoming={metricsNotAvailableIncoming.current}
        metricsNotAvailableOutgoing={metricsNotAvailableOutgoing.current}
        outgoingPodsPercentage={outgoingPodsPercentage}
        incomingPodsPercentage={incomingPodsPercentage}
        outgoingPods={outgoingPods.current}
        incomingPods={incomingPods.current}
        outgoingTotal={outgoingTotal}
        incomingTotal={incomingTotal}
      />
    </div>
  );
}

export default ConnectedPeer;
