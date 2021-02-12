import React from 'react';
import Utils from '../../services/Utils';
import { Axis, Chart, Coordinate, Interval, Tooltip } from 'bizcharts';
import { Alert } from 'antd';

/**
 * template is a CR of a CRD template (piechart in this case)
 * CR is the spec field of a CR of the user defined CRD that we want to represent
 */

function PieChart(props) {
  const utils = Utils();

  const data = [];
  const values = utils.index(props.CR, props.template.spec.values);
  const labels = utils.index(props.CR, props.template.spec.labels);
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

  if (data.length !== 0) {
    return (
      <div>
        <Chart height={400} data={data} autoFit>
          <Coordinate type="theta" radius={0.75} />
          <Tooltip showTitle={false} />
          <Axis visible={false} />
          <Interval
            position="value"
            adjust="stack"
            color="label"
            style={{
              lineWidth: 2,
              stroke: '#fff'
            }}
            label={[
              '*',
              {
                content: data => {
                  return data.value;
                }
              }
            ]}
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
    );
  }
}

export default PieChart;
