import React from 'react';
import { Chart, LineAdvance, Legend, Axis, Slider } from 'bizcharts';
import { addZero } from '../../views/homeView/HomeUtils';

function LineChart(props){

  let data = [];
  props.data.forEach(res => {
    if(!isFinite(res.value))
      res.value = 0;
    data.push(res);
  })

  if(data.length === 0){
    let date = new Date;
    let date_format = addZero(date.getHours()) + ':' + addZero(date.getMinutes()) + ':' + addZero(date.getSeconds());

    data.push(
      {"resource": "CPU", "date": date_format, "value": 0 },
      {"resource": "RAM", "date": date_format, "value": 0 }
    )
  }

  return (
    <Chart height={'30vh'} autoFit data={data}
           padding={[40, 20, 40, 40]}
           scale={{ value: {min: 0}, date: {tickCount: 5}}}
    >
      <LineAdvance
        shape="smooth"
        area
        position="date*value"
        color="resource"
      />
      <Legend position={'top'} />
      <Axis name={'value'}
            label={{formatter(text){
                return text + '%';
              }}}/>
      <Slider
        start={0}
        end={1}
        backgroundChart={{
          type: "line"
        }}
        height={10}
        handlerStyle={{
          height: 10
        }}
        formatter={() => {return ''}}
      />
    </Chart>
  )
}

export default LineChart;
