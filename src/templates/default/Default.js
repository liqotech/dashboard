import React, { Component } from 'react';
import { Table } from 'antd';

class Default extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const expandedRowRender = () => {
      const column = [{title: 'kind', dataIndex: 'kind', key: 'kind'}];
      const data = [{
        "kind": "Cost",
        "template": "crd-template.liqo.com/v1/piecharts/my-pie-3"
      },
        {
          "kind": "Advertisement",
          "template": "GEL"
        }];
      return <Table columns={column} dataSource={data} pagination={false} />
    }

    const column = [
      {title: 'kind', dataIndex: 'kind', key: 'kind'}
    ]
    const data = [
      {
        "kind": "Cost",
        "template": "crd-template.liqo.com/v1/piecharts/my-pie-3"
      },
      {
        "kind": "Advertisement",
        "template": "GEL"
      }
    ]
    return(
      <Table
        columns={column}
        expandable={{ expandedRowRender }}
        dataSource={data}
      />
    )
  }
}

export default Default;
