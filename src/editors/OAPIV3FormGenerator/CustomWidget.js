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
  return (
    <Switch id={props.id} style={{marginTop: 5, marginBottom: 5, float: 'right'}}
            checkedChildren={'ON'}
            unCheckedChildren={'OFF'}
            disabled={props.disabled}
            checked={props.value} onClick={() => {if(!props.readonly) props.onChange(!props.value)}} />
  );
};

const CustomInputNumber = function(props){
  return (
    <InputNumber id={props.id} style={{float: 'right'}}
                 disabled={props.disabled}
                 role={'textbox'}
                 min={ (props.schema.minimum || props.schema.minimum === 0) ? props.schema.minimum : Number.MIN_SAFE_INTEGER}
                 max={props.schema.maximum ? props.schema.maximum : Number.MAX_SAFE_INTEGER}
                 defaultValue={props.value}
                 value={props.value}
                 onChange={(value) => {if(!props.readonly) props.onChange(value)}}
    />
  )
}

const CustomText = function(props) {
  if(props.schema.type === 'integer'){
    if(props.schema.maximum && (props.schema.minimum || props.schema.minimum === 0)){
      if(props.schema.maximum === 100 && props.schema.minimum === 0){
        return (
          <Row>
            <Col span={19}>
              <Slider id={props.id}
                      disabled={props.disabled}
                      min={0}
                      max={100}
                      onChange={(value) => {if(!props.readonly) props.onChange(value)}}
                      value={typeof props.value === 'number' ? props.value : 0}
              />
            </Col>
            <Col span={5}>
              <InputNumber
                style={{float: 'right'}}
                disabled={props.disabled}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
                min={0}
                max={100}
                value={typeof props.value === 'number' ? props.value : 0}
                onChange={(value) => {if(!props.readonly) props.onChange(value)}}
              />
            </Col>
          </Row>
        )
      }
    }
    return CustomInputNumber(props);
  }
  else if(props.schema.type === 'number'){
    return CustomInputNumber(props);
  }
  return (
    <Input id={props.id} defaultValue={props.value} value={props.value} disabled={props.disabled}
           onChange={({ target }) => {if(!props.readonly) props.onChange(target.value)}}/>
  )
}

export const widgets = {
  CheckboxWidget: CustomCheckbox,
  TextWidget: CustomText
};
