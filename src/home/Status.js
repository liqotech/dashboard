import React, { Component } from 'react';
import { Badge, Col, Collapse, Divider, PageHeader, Progress, Row, Space, Typography, Tooltip } from 'antd';
import QuestionCircleOutlined from '@ant-design/icons/lib/icons/QuestionCircleOutlined';
import { addZero, convertCPU, convertRAM } from './HomeUtils';
import LineChart from '../templates/line/LineChart';
import Donut from '../templates/donut/Donut';
import ExclamationCircleTwoTone from '@ant-design/icons/lib/icons/ExclamationCircleTwoTone';

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
      historyHome: [],
      historyForeign: [],
      loading: false
    };

    this.flag = false;
    this.metricsNotAvailableIncoming = false;
    this.metricsNotAvailableOutgoing = false;

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
        totalMemory += convertRAM(no.status.allocatable.memory);
        totalCPU += convertCPU(no.status.allocatable.cpu);
    })
    if(home){
      this.setState({
        totalHome: {
          RAM: totalMemory,
          CPU: totalCPU
        },
      }, this.getConsumedResources)
    } else {
      this.setState({
        totalForeign: {
          RAM: totalMemory,
          CPU: totalCPU
        },
      })
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

  /** This means there are no metrics available */
  getConsumedMetricsNoMetricsServer(consumedHome){
    this.metricsNotAvailableIncoming = true;
    this.props.api.getPODs().
    then(res => {
      let pods = res.body.items.filter(po => {return po.spec.nodeName.slice(0, 5) !== 'liqo-'});
      consumedHome.CPU = 0;
      consumedHome.RAM = 0;
      pods.forEach(po => {
        po.spec.containers.forEach(co => {
          if(co.resources.requests && co.resources.requests.cpu && co.resources.requests.memory){
            consumedHome.CPU += convertCPU(co.resources.requests.cpu);
            consumedHome.RAM += convertRAM(co.resources.requests.memory);
            this.setState({consumedHome});
          }
        });
      })
    })
  }

  /**
   * Get the total of consumed resources
   */
  getConsumedResources() {
    let consumedHome = {
      CPU: this.state.consumedHome.CPU,
      RAM: this.state.consumedHome.RAM
    }

    this.props.api.getMetricsNodes()
      .then(res => {
        consumedHome.CPU = 0;
        consumedHome.RAM = 0;
        let home_nodes = res.items.filter(no => {return no.metadata.name.slice(0, 5) !== 'liqo-'});
        let foreign_nodes = res.items.filter(no => {return no.metadata.name.slice(0, 5) === 'liqo-'});
        if(foreign_nodes.length === 0){
          this.metricsNotAvailableOutgoing = true;
        }
        if(home_nodes.length !== 0){
          home_nodes.forEach(no => {
            consumedHome.CPU += convertCPU(no.usage.cpu);
            consumedHome.RAM += convertRAM(no.usage.memory);
          })
          this.setState({consumedHome});
        } else {
          this.getConsumedMetricsNoMetricsServer(consumedHome);
        }
      }).catch(() => {
        this.metricsNotAvailableOutgoing = true;
        this.getConsumedMetricsNoMetricsServer(consumedHome);
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
    let totalRAMPercentage = '';
    let totalCPUPercentage = '';
    let totalConsumedResources = home ? this.state.consumedHome : null;
    let totalAvailableResources = home ? this.state.totalHome : this.state.totalForeign;
    let externalMetrics = home ? this.props.incomingMetrics : this.props.outgoingMetrics;

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
     * the user is using their resources
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
                            header={<span>Home  {this.metricsNotAvailableIncoming ? (
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
              {resourcePanel(resourcesHome, this.state.historyHome)}
            </Collapse.Panel>
          </Collapse>
          <Collapse defaultActiveKey={['1']} className={'crd-collapse'} style={{backgroundColor: '#fafafa', marginTop: 16}}>
            <Collapse.Panel style={{ borderBottomColor: '#f0f0f0' }}
                            header={<span>Foreign (Total)  {this.metricsNotAvailableOutgoing ? (
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
              {resourcePanel(resourcesForeign, this.state.historyForeign)}
            </Collapse.Panel>
          </Collapse>
        </div>
      </div>
    )
  }
}

export default Status;
