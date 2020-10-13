import React, { useEffect, useRef, useState } from 'react';
import { Badge, Col, Collapse, Divider, PageHeader, Row, Space, Typography, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/lib/icons/QuestionCircleOutlined';
import { addZero, convertCPU, convertRAM } from './HomeUtils';
import LineChart from '../templates/line/LineChart';
import Donut from '../templates/donut/Donut';
import ExclamationCircleTwoTone from '@ant-design/icons/lib/icons/ExclamationCircleTwoTone';

function Status(props){

  let [totalHome, setTotalHome] = useState({
    CPU: 0,
    RAM: 0
  });
  let [totalForeign, setTotalForeign] = useState({
    CPU: 0,
    RAM: 0
  });
  let [consumedHome, setConsumedHome] = useState({
    CPU: 0,
    RAM: 0
  });
  const [trendHome, setTrendHome] = useState([]);
  const [trendForeign, setTrendForeign] = useState([]);
  const incomingMetrics = useRef([]);
  const outgoingMetrics = useRef([]);

  let metricsNotAvailableIncoming = useRef(false);
  let metricsNotAvailableOutgoing = useRef(false);

  useEffect(() => {
    /**
     * Get the total of the available resources on the home or foreign cluster
     * only once, when the component is mounted
     */
    getTotalResources(props.homeNodes, true);
    getTotalResources(props.foreignNodes);
  }, [])

  useEffect(() => {
    incomingMetrics.current = props.incomingMetrics;
    outgoingMetrics.current = props.outgoingMetrics;
  }, [props.outgoingMetrics, props.incomingMetrics])

  useEffect(() => {
    /**
     * Every 30 seconds the metrics are retrieved and the view updated
     */
    let interval = setInterval( () => {
      setConsumedHome(prev => {consumedHome = prev; return prev});
      setTotalHome(prev => {totalHome = prev; return prev});
      setTotalForeign(prev => {totalForeign = prev; return prev});
      updateTrend();
    }, 30000);

    return () => {
      clearInterval(interval);
    }
  }, [])

  useEffect(() => {
    getConsumedResources();
  }, [totalHome])

  const updateTrend = () => {
    getConsumedResources();
    let date = new Date;
    let date_format = addZero(date.getHours()) + ':' + addZero(date.getMinutes()) + ':' + addZero(date.getSeconds());

    const resourcesHome = getPercentages(true);
    const resourcesForeign = getPercentages(false);

    setTrendHome(prev => [ ...prev,
      {"resource": "CPU", "date": date_format, "value": resourcesHome.totCPU },
      {"resource": "RAM", "date": date_format, "value": resourcesHome.totRAM }
    ]);

    setTrendForeign(prev => [...prev,
      {"resource": "CPU", "date": date_format, "value": resourcesForeign.totCPU },
      {"resource": "RAM", "date": date_format, "value": resourcesForeign.totRAM }
    ]);
  }

  /**
   * Gets the total allocatable resources for a cluster
   * @nodes the total of nodes (home or foreign)
   * @home if the cluster is the home one or a foreign
   */
  const getTotalResources = (nodes, home) => {
    nodes.forEach(no => {
      if(home){
        setTotalHome(prev => {
          return {
            RAM: prev.RAM + convertRAM(no.status.allocatable.memory),
            CPU: prev.CPU + convertCPU(no.status.allocatable.cpu)
          }
        });
      } else {
        setTotalForeign(prev => {
          return {
            RAM: prev.RAM + convertRAM(no.status.allocatable.memory),
            CPU: prev.CPU + convertCPU(no.status.allocatable.cpu)
          }
        });
      }
    })
  }

  /** This means there are no metrics available */
  const getConsumedMetricsNoMetricsServer = () => {
    metricsNotAvailableIncoming.current = true;
    window.api.getPODsAllNamespaces().
    then(res => {
      let pods = res.body.items.filter(po => {
        if(po.spec.nodeName)
          return po.spec.nodeName.slice(0, 5) !== 'liqo-'
        else return true;
      });
      let counter = 0;
      let _consumedHome = {CPU: 0, RAM: 0};
      pods.forEach(po => {
        po.spec.containers.forEach(co => {
          if(co.resources.requests && co.resources.requests.cpu && co.resources.requests.memory){
            _consumedHome={
              CPU: _consumedHome.CPU + convertCPU(co.resources.requests.cpu),
              RAM: _consumedHome.RAM + convertRAM(co.resources.requests.memory)
            }
          }
        });
        counter++;
        if(counter === pods.length)
          setConsumedHome(_consumedHome);
      })
    }).catch(error => console.log(error));
  }

  /**
   * Get the total of consumed resources
   */
  const getConsumedResources = () => {

    window.api.getMetricsNodes()
      .then(res => {
        let _consumedHome = {
          CPU: 0,
          RAM: 0
        };
        let home_nodes = res.items.filter(no => {return no.metadata.name.slice(0, 5) !== 'liqo-'});
        let foreign_nodes = res.items.filter(no => {return no.metadata.name.slice(0, 5) === 'liqo-'});
        if(foreign_nodes.length === 0){
          metricsNotAvailableOutgoing.current = true;
        }
        if(home_nodes.length !== 0){
          let counter = 0;
          home_nodes.forEach(no => {
            _consumedHome = {
              CPU: _consumedHome.CPU + convertCPU(no.usage.cpu),
              RAM: _consumedHome.RAM + convertRAM(no.usage.memory)
            }
            counter++;
            if(counter === home_nodes.length)
              setConsumedHome(_consumedHome);
          })
        } else {
          getConsumedMetricsNoMetricsServer();
        }
      }).catch(() => {
        metricsNotAvailableOutgoing.current = true;
        getConsumedMetricsNoMetricsServer();
    })
  }

  /**
   * Use the consumed resources and the total to get percentages
   * @home: if the percentages refer to the home cluster or not
   * @returns percentages of CPU and RAM
   */
  const getPercentages = home => {
    let clusterRAMPercentage;
    let clusterCPUPercentage;
    let totalRAMPercentage = '';
    let totalCPUPercentage = '';
    let totalConsumedResources = home ? consumedHome : null;
    let totalAvailableResources = home ? totalHome : totalForeign;
    let externalMetrics = home ? incomingMetrics.current : outgoingMetrics.current;

    let dataRAM = [];
    let dataCPU = [];

    if(home){
      totalRAMPercentage = parseFloat(((totalConsumedResources.RAM/totalAvailableResources.RAM)*100).toFixed(2));
      totalCPUPercentage = parseFloat(((totalConsumedResources.CPU/totalAvailableResources.CPU)*100).toFixed(2));
    }

    clusterRAMPercentage = totalRAMPercentage;
    clusterCPUPercentage = totalCPUPercentage;

    externalMetrics.forEach(metrics => {
      let metricsPercentageRAM = parseFloat(((metrics.RAM/totalAvailableResources.RAM)*100).toFixed(2));
      if(home)
        clusterRAMPercentage -= metricsPercentageRAM;
      else
        totalRAMPercentage += metricsPercentageRAM.toFixed(2);

      dataRAM.push({
        fc: metrics.fc,
        value: metricsPercentageRAM
      })

      let metricsPercentageCPU = parseFloat(((metrics.CPU/totalAvailableResources.CPU)*100).toFixed(2));
      if(home)
        clusterCPUPercentage -= metricsPercentageCPU;
      else
        totalCPUPercentage += metricsPercentageCPU.toFixed(2);

      dataCPU.push({
        fc: metrics.fc,
        value: metricsPercentageCPU
      })
    })

    /**
     * When showing the home resources, it is interesting to show also how much
     *  the user is using their resources
     */
    if(home){
      dataRAM.unshift({
        fc: 'You',
        value: parseFloat(clusterRAMPercentage.toFixed(2))
      })

      dataCPU.unshift({
        fc: 'You',
        value: parseFloat(clusterCPUPercentage.toFixed(2))
      })
    } else {
      /** To maintain the color coding */
      dataRAM.unshift({
        fc: '',
        value: 0
      })

      dataCPU.unshift({
        fc: '',
        value: 0
      })
    }

    return {
      totRAM: parseFloat(totalRAMPercentage),
      totCPU: parseFloat(totalCPUPercentage),
      CPU: dataCPU,
      RAM: dataRAM
    }
  }

  const resourcesHome = getPercentages(true);
  const resourcesForeign = getPercentages(false);

  const resourcePanel = (resources, data) => (
    <div style={{marginTop: 10}}>
      <Row>
        <Badge text={<Typography.Text strong>Consumption</Typography.Text>}
               status={'processing'} style={{marginLeft: '1em', marginBottom: '1em'}}
        />
      </Row>
      <Row gutter={[20, 20]} align={'center'} justify={'center'}>
        <Col>
          <Row justify={'center'}>
            <Typography.Text strong>CPU ({isNaN(resources.totCPU) ? 0 : resources.totCPU}%)</Typography.Text>
          </Row>
          <Row justify={'center'}>
            <Donut data={resources.CPU} />
          </Row>
        </Col>
        <Col>
          <Row justify={'center'}>
            <Typography.Text strong>RAM ({isNaN(resources.totRAM) ? 0 : resources.totRAM}%)</Typography.Text>
          </Row>
          <Row justify={'center'}>
            <Donut data={resources.RAM} />
          </Row>
        </Col>
      </Row>
      <Row>
        <Badge text={<Typography.Text strong>Consumption trend</Typography.Text>}
               status={'processing'} style={{marginLeft: '1em', marginBottom: '1em'}}
        />
      </Row>
      <Row>
        <LineChart data={data} />
      </Row>
    </div>
  )

  return(
    <div className="home-header">
      <div style={{position: 'fixed', zIndex: 10, width: '100%', backgroundColor: 'white'}}>
        <PageHeader style={{paddingTop: 4, paddingBottom: 4, paddingLeft: 16, paddingRight: 16}}
                    title={
                      <Space>
                        <Typography.Text strong style={{fontSize: 24}}>Cluster Status</Typography.Text>
                      </Space>
                    }
                    className={'draggable'}
        />
        <Divider style={{marginTop: 0, marginBottom: 4}}/>
      </div>
      <div style={{paddingTop: '7vh', paddingBottom: 4, paddingLeft: 16, paddingRight: 16}} >
        <Collapse defaultActiveKey={['1']} className={'crd-collapse'} style={{backgroundColor: '#fafafa'}}>
          <Collapse.Panel style={{ borderBottomColor: '#f0f0f0' }}
                          header={<span>Home  {metricsNotAvailableIncoming.current ? (
                            <Tooltip title={'Precise metrics not available in your cluster'}>
                            <ExclamationCircleTwoTone twoToneColor="#f5222d" />
                            </Tooltip>) : null}</span>} key="1"
                          extra={
                            <Tooltip title={'Consumption on your cluster'}
                                     placement={'left'}
                            >
                              <QuestionCircleOutlined />
                            </Tooltip>
                          }
          >
            {resourcePanel(resourcesHome, trendHome)}
          </Collapse.Panel>
        </Collapse>
        {props.config ? (
          <Collapse defaultActiveKey={['1']} className={'crd-collapse'} style={{backgroundColor: '#fafafa', marginTop: 16}}>
            <Collapse.Panel style={{ borderBottomColor: '#f0f0f0' }}
                            header={<span>Foreign (Total)  {metricsNotAvailableOutgoing.current ? (
                              <Tooltip title={'Precise metrics not available in some of the foreign clusters'}>
                                <ExclamationCircleTwoTone twoToneColor="#f5222d" />
                              </Tooltip>) : null}</span>} key="1"
                            extra={
                              <Tooltip title={'Consumption on others\' cluster'}
                                       placement={'left'}
                              >
                                <QuestionCircleOutlined />
                              </Tooltip>
                            }
            >
              {resourcePanel(resourcesForeign, trendForeign)}
            </Collapse.Panel>
          </Collapse>
        ) : null}
      </div>
    </div>
  )
}

export default Status;
