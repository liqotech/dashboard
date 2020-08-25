import React, { Component } from 'react';
import { Badge, Col, Collapse, Divider, PageHeader, Progress, Row, Space, Typography, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/lib/icons/QuestionCircleOutlined';
import { addZero } from './HomeUtils';
import LineChart from '../templates/line/LineChart';
import Donut from '../templates/donut/Donut';

const n = 1000000000;

class Status extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: [],
      totalHome: {
        CPU: 0,
        RAM: 0
      },
      totalForeign: {
        CPU: 0,
        RAM: 0
      },
      consumedHome: {
        CPU: 0,
        RAM: 0
      },
      consumedForeign: {
        CPU: 0,
        RAM: 0
      },
      historyHome: [],
      historyForeign: [],
      loading: false
    };

    this.flag = false;

    /**
     * Every 30 seconds the metrics are retrieved and the view updated
     */
    this.interval = setInterval( () => {
      this.updateHistory();
    }, 30000);
  }

  updateHistory(){
    this.getConsumedResources();
    let date = new Date;
    let date_format = addZero(date.getHours()) + ':' + addZero(date.getMinutes()) + ':' + addZero(date.getSeconds());

    const resourcesHome = this.getPercentages(true);
    const resourcesForeign = this.getPercentages(false);

    this.state.historyHome.push(
      {"resource": "CPU", "date": date_format, "value": resourcesHome.totCPU },
      {"resource": "RAM", "date": date_format, "value": resourcesHome.totRAM }
    )

    this.state.historyForeign.push(
      {"resource": "CPU", "date": date_format, "value": resourcesForeign.totCPU },
      {"resource": "RAM", "date": date_format, "value": resourcesForeign.totRAM }
    )
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  /**
   * Gets the total allocatable resources for a cluster
   * @nodes the total of nodes (home or foreign)
   * @home if the cluster is the home one or a foreign
   */
  getTotalResources(nodes, home){
    let totalMemory = 0;
    let totalCPU = 0;
    nodes.forEach(no => {
        totalMemory += parseInt(no.status.allocatable.memory);
        totalCPU += parseInt(no.status.allocatable.cpu);
    })
    if(home){
      this.setState({
        totalHome: {
          RAM: totalMemory,
          CPU: totalCPU*n
        },
      }, this.getConsumedResources)
    } else {
      this.setState({
        totalForeign: {
          RAM: Math.round(totalMemory/100),
          CPU: totalCPU*1000000
        },
      }, this.getConsumedResources)
    }
  }

  /**
   * Get the total of the available resources on the home or foreign cluster
   * only once, when the component is mounted
   */
  componentDidMount() {
    this.getTotalResources(this.props.homeNodes, true);
    this.getTotalResources(this.props.foreignNodes);
  }

  /**
   * If the first time the nodes weren't available, retry
   */
  componentDidUpdate(prevProps, prevState, snapshot) {
    if(prevProps.incomingMetrics.length === 0 && this.props.incomingMetrics.length > 0 ||
      prevProps.outgoingMetrics.length === 0 && this.props.outgoingMetrics.length > 0){
      this.updateHistory();
    }
  }

  /**
   * Get the total of consumed resources
   */
  getConsumedResources() {
    let consumedHome = {
      CPU: 0,
      RAM: 0
    }

    let consumedForeign = {
      CPU: 0,
      RAM: 0
    }

    this.props.api.getMetricsNodes()
      .then(res => {
        /**
         * The virtual kubelet do not export metrics for now
         */
        res.items.forEach(no => {
          /**
           * It's assumed the nodes called liqo-<ClusterID>
           * are the virtual nodes (so, foreign)
           */
          if(no.metadata.name.substring(0, 5) === 'liqo-'){
            consumedForeign.CPU += parseInt(no.usage.cpu);
            consumedForeign.RAM += parseInt(no.usage.memory);
          }else{
            consumedHome.CPU += parseInt(no.usage.cpu);
            consumedHome.RAM += parseInt(no.usage.memory);
          }
        })

        this.setState({consumedHome, consumedForeign});
      })
      .catch(error => {
        console.log(error);
      })
  }

  /**
   * Use the consumed resources and the total to get percentages
   * @home: if the percentages refer to the home cluster or not
   * @returns percentages of CPU and RAM
   */
  getPercentages(home) {
    let clusterRAMPercentage;
    let clusterCPUPercentage;
    let totalRAMPercentage;
    let totalCPUPercentage;
    let totalConsumedResources = home ? this.state.consumedHome : this.state.consumedForeign;
    let totalAvailableResources = home ? this.state.totalHome : this.state.totalForeign;
    let externalMetrics = home ? this.props.incomingMetrics : this.props.outgoingMetrics;

    let dataRAM = [];
    let dataCPU = [];

    totalRAMPercentage = parseFloat(((totalConsumedResources.RAM/totalAvailableResources.RAM)*100).toFixed(2));
    totalCPUPercentage = parseFloat(((totalConsumedResources.CPU/totalAvailableResources.CPU)*100).toFixed(2));

    clusterRAMPercentage = totalRAMPercentage;
    clusterCPUPercentage = totalCPUPercentage;

    externalMetrics.forEach(metrics => {
      let metricsPercentageRAM = parseFloat(((metrics.RAM/totalAvailableResources.RAM)*100).toFixed(2));
      clusterRAMPercentage -= metricsPercentageRAM;
      dataRAM.push({
        fc: metrics.fc,
        value: metricsPercentageRAM
      })

      let metricsPercentageCPU = parseFloat(((metrics.CPU/totalAvailableResources.CPU)*100).toFixed(2));
      clusterCPUPercentage -= metricsPercentageCPU;
      dataCPU.push({
        fc: metrics.fc,
        value: metricsPercentageCPU
      })
    })

    dataRAM.unshift({
      fc: 'You',
      value: clusterRAMPercentage
    })

    dataCPU.unshift({
      fc: 'You',
      value: clusterCPUPercentage
    })

    return {
      totRAM: totalRAMPercentage,
      totCPU: totalCPUPercentage,
      CPU: dataCPU,
      RAM: dataRAM
    }
  }

  render() {
    const resourcesHome = this.getPercentages(true);
    const resourcesForeign = this.getPercentages(false);

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
              <Typography.Text strong>CPU ({resources.totCPU}%)</Typography.Text>
            </Row>
            <Row justify={'center'}>
              <Donut data={resources.CPU} />
            </Row>
          </Col>
          <Col>
            <Row justify={'center'}>
              <Typography.Text strong>RAM ({resources.totRAM}%)</Typography.Text>
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
        <PageHeader style={{paddingTop: 4, paddingBottom: 4, paddingLeft: 16, paddingRight: 16}}
                    title={
                      <Space>
                        <Typography.Text strong style={{fontSize: 24}}>Cluster Status</Typography.Text>
                      </Space>
                    }
                    className={'draggable'}
        />
        <Divider style={{marginTop: 0, marginBottom: 10}}/>
        <div style={{paddingTop: 4, paddingBottom: 4, paddingLeft: 16, paddingRight: 16}}>
          <Collapse defaultActiveKey={['1']} className={'crd-collapse'} style={{backgroundColor: '#fafafa'}}>
            <Collapse.Panel style={{ borderBottomColor: '#f0f0f0' }}
                            header={<span>Home</span>} key="1"
                            extra={
                              <Tooltip title={'Consumption on your cluster'}
                                       placement={'left'}
                              >
                                <QuestionCircleOutlined />
                              </Tooltip>
                            }
            >
              {resourcePanel(resourcesHome, this.state.historyHome)}
            </Collapse.Panel>
          </Collapse>
          <Collapse defaultActiveKey={['1']} className={'crd-collapse'} style={{backgroundColor: '#fafafa', marginTop: 16}}>
            <Collapse.Panel style={{ borderBottomColor: '#f0f0f0' }}
                            header={<span>Foreign (Total)</span>} key="1"
                            extra={
                              <Tooltip title={'Consumption on others\' cluster'}
                                       placement={'left'}
                              >
                                <QuestionCircleOutlined />
                              </Tooltip>
                            }
            >
              {resourcePanel(resourcesForeign, this.state.historyForeign)}
            </Collapse.Panel>
          </Collapse>
        </div>
      </div>
    )
  }
}

export default Status;
