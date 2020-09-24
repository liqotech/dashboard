import React from 'react';
import './HistoChart.css';
import Utils from '../../services/Utils';
import { Chart, Interval } from 'bizcharts';
import { Alert } from 'antd';

function HistoChart(props) {
  const utils = Utils();

  const data = [];
  const values = utils.index(props.CR, props.template.spec.values);
  const labels = utils.index(props.CR, props.template.spec.labels);
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
      <Alert
        message="Error"
        description="Something went wrong"
        type="error"
        showIcon
      />
    )
  }

}

export default HistoChart;
