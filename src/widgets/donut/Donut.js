import React, { useEffect, useState } from 'react';
import { Chart, Interval, Tooltip, Legend, Axis, Coordinate } from 'bizcharts';
import { colorsBasic } from '../../services/Colors';

function Donut(props) {
  let empty = {
    fc: 'Free',
    value: 100
  };

  props.data.forEach(d => {
    if (!isFinite(d.value)) d.value = 0;
    empty.value -= d.value;
  });

  empty.value = Math.round(empty.value * 100) / 100;

  props.data.push(empty);

  return (
    <Chart data={props.data} height={'10em'} width={'10em'} autoFit>
      <Coordinate type="theta" radius={0.8} innerRadius={0.7} />
      <Axis visible={false} />
      <Legend visible={false} />
      <Tooltip>
        {(title, items) => {
          return (
            <div style={{ paddingTop: 12, paddingBottom: 12 }}>
              <span
                style={{
                  backgroundColor: items[0].color,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  display: 'inline-block',
                  marginRight: 8
                }}
              />
              {items[0].data.fc}:{' '}
              <span style={{ marginLeft: 12 }}>{items[0].data.value}%</span>
            </div>
          );
        }}
      </Tooltip>
      <Interval
        adjust="stack"
        position="value"
        shape="sliceShape"
        color={[
          'fc',
          d => {
            if (d === 'Free') return '#f3f3f3';
            return colorsBasic[
              props.data.indexOf(
                props.data.find(datum => {
                  return datum.fc === d;
                })
              )
            ];
          }
        ]}
        animate={false}
      />
    </Chart>
  );
}

export default Donut;
