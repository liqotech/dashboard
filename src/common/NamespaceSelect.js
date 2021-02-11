import { SelectOutlined } from '@ant-design/icons';
import { Col, Row, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Utils from '../services/Utils';

export default function NamespaceSelect(props) {
  const [selectedNS, setSelectedNS] = useState('');
  const NSOptions = useRef([]);
  const NSs = useRef([]);

  useEffect(() => {
    if (Utils().parseJWT() && Utils().parseJWT().namespace) {
      const ns = Utils().parseJWT().namespace[0];
      NSOptions.current.push(
        <Select.Option key={ns} value={ns} children={ns} />
      );
      setSelectedNS(ns);
    }

    window.api
      .getNamespaces()
      .then(res => {
        NSs.current = res.body.items;

        NSs.current.forEach(NS =>
          NSOptions.current.push(
            <Select.Option
              key={NS.metadata.name}
              value={NS.metadata.name}
              children={NS.metadata.name}
            />
          )
        );

        if (props.defaultNS) {
          setSelectedNS(props.defaultNS);
        } else {
          NSOptions.current.push(
            <Select.Option
              key={'all namespaces'}
              value={'all namespaces'}
              children={'all namespaces'}
            />
          );

          handleExternalChangeNS();
          window.api.NSArrayCallback.current.push(handleExternalChangeNS);
        }
      })
      .catch(error => console.log(error));
  }, []);

  const handleExternalChangeNS = () => {
    if (!window.api.namespace.current) setSelectedNS('all namespaces');
    else setSelectedNS(window.api.namespace.current);
  };

  const handleChangeNS = item => {
    setSelectedNS(item);

    if (props.handleChangeNS) props.handleChangeNS(item);
    else window.api.setNamespace(item);
  };

  return (
    <Select
      style={props.style ? props.style : { paddingRight: 20, minWidth: '10em' }}
      bordered={!!props.bordered}
      showSearch
      aria-label={'select-namespace'}
      placeholder={'Select namespace'}
      value={
        <Row align={'middle'}>
          <Col>
            <SelectOutlined style={{ fontSize: '15px' }} />
          </Col>
          <Col>{selectedNS}</Col>
        </Row>
      }
      onChange={handleChangeNS}
    >
      {NSOptions.current}
    </Select>
  );
}
