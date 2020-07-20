import React, { Component } from 'react';
import './HistoChart.css';
import Utils from '../../services/Utils';
import { Chart, Interval } from 'bizcharts';
import { Typography } from 'antd';

class HistoChart extends Component {
  constructor(props) {
    super(props);
    this.utils = new Utils();
  }

  setValues() {
    return this.utils.index(this.props.CR, this.props.template.spec.values);
  }

  setLabels() {
    return this.utils.index(this.props.CR, this.props.template.spec.labels);
  }

  render() {

    const data = [];
    const values = this.setValues();
    const labels = this.setLabels();
    if (values && labels){
      for(let i = 0; i < values.length; i++) {
        if(values[i] !== undefined && labels[i] !== undefined){
          data.push({
            value: values[i],
            label: labels[i]
          });
        }
      }
    }

    if(data.length !== 0){
      return (
        <div>
          <Chart  height={400} data={data} autoFit>
            <Interval
              position="label*value"
            />
          </Chart>
        </div>
      );
    } else {
      return (
          <Typography.Title level={4} style={{textAlign: 'center'}} type={'danger'}>
            Something went wrong
          </Typography.Title>
        )
    }
  }
}

export default HistoChart;
