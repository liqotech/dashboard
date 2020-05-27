import React, { Component } from 'react';
import './PieChart.css';
import Utils from '../../services/Utils';
import { Axis, Chart, Coordinate, Interval, Tooltip } from 'bizcharts';
import { Typography } from 'antd';

const { Title } = Typography;

/**
 * template is a CR of a CRD template (piechart in this case)
 * CR is the spec field of a CR of the user defined CRD that we want to represent
 */

class PieChart extends Component {
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
    if (values && labels) {
      for (let i = 0; i < values.length; i++) {
        if (values[i] !== undefined && labels[i] !== undefined) {
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
            <Coordinate type="theta" radius={0.75} />
            <Tooltip showTitle={false} />
            <Axis visible={false} />
            <Interval
              position="value"
              adjust="stack"
              color="label"
              style={{
                lineWidth: 2,
                stroke: '#fff',
              }}
              label={['*', {
                content: (data) => {
                  return data.value;
                },
              }]}
            />
          </Chart>
        </div>
      );
    } else {
      return (
        <Title level={4} style={{textAlign: 'center'}} type={'danger'}>
          Something went wrong
        </Title>

      )
    }


  }

}

export default PieChart;
