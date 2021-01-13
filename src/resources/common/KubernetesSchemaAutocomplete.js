import { useParams } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { Col, Button, Select, Tooltip, Row } from 'antd';
import { CloseOutlined, SaveOutlined } from '@ant-design/icons';
import _ from 'lodash';
let definitions;

export default function KubernetesSchemaAutocomplete(props){
  let params = props.params ? props.params : useParams();
  const [totItems, setTotItems] = useState([]);
  let tot = [];
  let columnValue = '';

  useEffect(() => {
    if(!props.CRD)
      getSchema();
    else {
      window.api.getKubernetesJSONSchema()
        .then(r => {
          definitions = r.definitions;
          fillItems(props.CRD.spec.validation.openAPIV3Schema.properties, '', 0);
        })
    }
  }, [props.kind]);

  const getSchema = () => {
    window.api.getKubernetesJSONSchema()
      .then(r => {
        let res = 'io.k8s.api.' +
          (params.group ? params.group.split('.')[0] + '.' : 'core.') +
          params.version + '.' +
          props.kind
        if(props.kind === 'CustomResourceDefinition'){
          res = 'io.k8s.apiextensions-apiserver.pkg.apis.apiextensions.v1beta1.CustomResourceDefinition'
        }
        definitions = r.definitions;
        fillItems(r.definitions[res], '', 0);
      })
  }

  const checkIfGood = (key, obj) => {
    return !((definitions['io.k8s.apiextensions-apiserver.pkg.apis.apiextensions.v1.JSONSchemaProps']
        .properties[key] &&
      key !== '$ref' &&
      key !== 'properties' &&
      key !== 'items' &&
      key !== 'type') ||
      key.slice(0, 3) === 'x-k' ||
      key === 'type' && typeof obj[key] === 'string'
    );
  }

  const groupItems = tot => {
    let temp = _.chain(tot).groupBy('label').map((value, key) => ({label: key, value:key + '.', options: value})).value();
    temp.forEach(item => {
      let ops = [];
      item.options.forEach(op => ops.push(...op.options))
      item.options = ops;
    })
    setTotItems(temp);
  }

  const fillItems = (obj, path, counter) => {
    for (let key in obj) {
      // skip loop if the property is from prototype
      if (obj.hasOwnProperty(key) && checkIfGood(key, obj) && typeof obj === 'object'){
        if(key === 'properties' ||
          key === 'items'
        ){
          fillItems(obj[key], path, counter + 1);
        } else if(key === '$ref' && typeof obj[key] === 'string'){
          getReferencedSchema(obj[key], path, counter + 1)
        } else {
          tot = [...tot, {
            value: path ? (path + '.' + key + '.') : key + '.',
            label: path ? path.replace(/\./gi, '/') : 'root',
            options: [{
              label: key,
              value: path ? (path + '.' + key) : key
            }]
          }];
          fillItems(obj[key], path ? (path + '.' + key) : key, counter + 1);
        }
      }
    }

    if(path === '') {
      groupItems(tot);
    }
  }

  function getReferencedSchema(ref, path, counter) {
    fillItems(definitions[ref.split('/')[2]], path, counter);
  }

  const onSearch = (value, option) => {
    if(!option.value && !totItems.find(item => item.value === (value + '.'))){
      columnValue = columnValue + value + '%//';
    } else {
      columnValue = columnValue + 'param.' + option.value + '%//';
    }
  }

  const onDeselect = (value, option) => {
    if(option.label){
      let key = 'param.' + value + '%//';
      columnValue = columnValue.split(key).join('');
    }else{
      columnValue = columnValue.split(value).join('');
    }
  }

  function onComplete() {
    let array = columnValue.split('%//');
    let columnName = '';
    array.forEach(name => {
      if(name.slice(0, 6) === 'param.'){
        columnName += _.capitalize(name.split('.').slice(-1).toString());
      } else columnName += name;
    })
    props.updateFunc(columnValue.slice(0, -3), columnName);
  }

  return(
    <div>
      <Row align={'center'}>
        <Col span={props.single ? 24 : 18}>
          <Select
            aria-label={'select-k8s'}
            allowClear
            onDeselect={onDeselect}
            onClear={props.onClear? props.onClear : null}
            style={{width: '100%'}}
            size={'small'}
            placeholder={'Select parameter'}
            filterOption={(inputValue, option) => {
              return option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }}
            options={totItems}
            onSelect={props.onSearch ? props.onSearch : onSearch}
            showSearch
            mode={props.single ? null : 'tags'}
          />
        </Col>
        {!props.single ? (
          <Col span={6}>
            <div style={{float: 'right', width: 55}}>
              <Tooltip title={'Save column'}>
                <Button type={'primary'} icon={<SaveOutlined />}
                        onClick={onComplete}
                        size={'small'}
                />
              </Tooltip>
              <Tooltip title={'Cancel'}>
                <Button type={'danger'} icon={<CloseOutlined />}
                        onClick={props.cancelFunc}
                        size={'small'}
                        style={{marginLeft: 4}}
                />
              </Tooltip>
            </div>
          </Col>
        ) : null}
      </Row>
    </div>
  )

}
