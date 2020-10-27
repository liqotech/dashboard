import {Table} from 'antd';
import React, { useEffect } from 'react';

export default function TableViewer(props){
  const columns = [];
  const dataSource = [];

  if(props.form[props.title].length > 0){
    Object.keys(props.form[props.title][0]).forEach(key => {
      columns.push({
        title: key,
        dataIndex: key,
        key: key,
      })
    })

    let counter = 0;

    props.form[props.title].forEach(item => {
      let row = {};
      row.key = counter;
      Object.keys(item).forEach(key => {
        if(typeof item[key] !== 'object')
          row[key] = item[key];
        else
          row[key] = key + '#' + counter;
      })
      dataSource.push(row)
      counter++;
    })
  }

  return(
    <div style={{ margin: -13 }}>
      <Table key={props.title} dataSource={dataSource}
             columns={columns} size={'small'} bordered
             pagination={{
               size: 'small',
               hideOnSinglePage: true
             }}
             scroll={{ x: 'max-content' }}
      />
    </div>
  )
}
