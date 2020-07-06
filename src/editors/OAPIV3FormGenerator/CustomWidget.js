import { Col, Input, InputNumber, Row, Slider, Space, Switch, Typography } from 'antd';
import React from 'react';
import { splitCamelCaseAndUp } from '../../services/stringUtils';

export const uiSchema = {
  "ui:widget": "custom",
  "ui:options": {
    label: false
  }
};

const CustomCheckbox = function(props) {
  return (
    <Space size={'small'}>
      <Switch id={props.id} checked={props.value} onClick={() => props.onChange(!props.value)} />
      <Typography.Text strong>{splitCamelCaseAndUp(props.label)}</Typography.Text>
    </Space>
  );
};

const CustomText = function(props) {
  //console.log(props)
  if(props.schema.type === 'integer'){
    if(props.schema.maximum && (props.schema.minimum || props.schema.minimum === 0)){
      if(props.schema.maximum === 100 && props.schema.minimum === 0){
        return (
          <Row>
            <Col span={12}>
              <Slider id={props.id}
                      min={0}
                      max={100}
                      onChange={(value) => props.onChange(value)}
                      value={typeof props.value === 'number' ? props.value : 0}
              />
            </Col>
            <Col span={4}>
              <InputNumber
                min={0}
                max={100}
                style={{ margin: '0 16px' }}
                value={typeof props.value === 'number' ? props.value : 0}
                onChange={(value) => props.onChange(value)}
              />
            </Col>
          </Row>
        )
      }
    }
    return (
      <InputNumber id={props.id}
                   min={ (props.schema.minimum || props.schema.minimum === 0) ? props.schema.minimum : Number.MIN_SAFE_INTEGER}
                   max={props.schema.maximum ? props.schema.maximum : Number.MAX_SAFE_INTEGER}
                   defaultValue={props.value}
                   onChange={(value) => props.onChange(value)}
      />
    )
  }
  return (
    <Input id={props.id} defaultValue={props.value} onChange={({ target }) => props.onChange(target.value)}/>
  )
}

export const widgets = {
  CheckboxWidget: CustomCheckbox,
  TextWidget: CustomText
};
