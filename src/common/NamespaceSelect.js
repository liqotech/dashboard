import { SelectOutlined } from '@ant-design/icons';
import  { Col, Row, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

export default function NamespaceSelect(){
  const [selectedNS, setSelectedNS] = useState('');
  const NSOptions = useRef([]);
  const NSs = useRef([]);

  useEffect(() => {
    window.api.getNamespaces().then(res => {
      NSs.current = res.body.items;

      NSs.current.forEach(NS => NSOptions.current.push(
        <Select.Option key={NS.metadata.name} value={NS.metadata.name} children={NS.metadata.name}/>
      ));

      NSOptions.current.push(
        <Select.Option key={'all namespaces'} value={'all namespaces'} children={'all namespaces'}/>
      )

      if(!window.api.namespace.current)
        setSelectedNS('all namespaces');
      else setSelectedNS(window.api.namespace.current);
    }).catch(error => console.log(error));
  }, [])

  const handleChangeNS = item => {
    window.api.setNamespace(item);
    setSelectedNS(item);
  };

  return(
    <Select
      style={{paddingRight: 20, minWidth: '10em'}}
      bordered={false}
      aria-label={'select-namespace'}
      placeholder={'Select namespace'}
      value={
        <Row align={'middle'}>
          <Col>
            <SelectOutlined style={{ fontSize: '15px' }} />
          </Col>
          <Col>
            {selectedNS}
          </Col>
        </Row>
      }
      onChange={handleChangeNS}
    >
      {NSOptions.current}
    </Select>
  )
}
