import {
  Col, Input, InputNumber, Row, Slider,
  Space, Switch, Typography, Tooltip, Badge, Card
} from 'antd';
import React from 'react';
import { splitCamelCaseAndUp } from '../../services/stringUtils';
import QuestionOutlined from '@ant-design/icons/lib/icons/QuestionOutlined';
import { QuestionCircleOutlined } from '@ant-design/icons';

/** Custom widgets */

const CustomCheckbox = function(props) {
  //console.log(props)
  return (
    <Switch id={props.id} style={{marginTop: 5, marginBottom: 5, float: 'right'}}
            checkedChildren={'ON'}
            unCheckedChildren={'OFF'}
            checked={props.value} onClick={() => props.onChange(!props.value)} />
  );
};

const CustomText = function(props) {
  //console.log(props)
  if(props.schema.type === 'integer'){
    if(props.schema.maximum && (props.schema.minimum || props.schema.minimum === 0)){
      if(props.schema.maximum === 100 && props.schema.minimum === 0){
        return (
          <Row>
            <Col span={19}>
              <Slider id={props.id}
                      min={0}
                      max={100}
                      onChange={(value) => props.onChange(value)}
                      value={typeof props.value === 'number' ? props.value : 0}
              />
            </Col>
            <Col span={5}>
              <InputNumber
                style={{float: 'right'}}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
                min={0}
                max={100}
                value={typeof props.value === 'number' ? props.value : 0}
                onChange={(value) => props.onChange(value)}
              />
            </Col>
          </Row>
        )
      }
    }
    return (
      <InputNumber id={props.id} style={{float: 'right'}}
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
