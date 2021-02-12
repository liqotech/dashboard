import { Col, Input, InputNumber, Row, Slider, Switch, DatePicker } from 'antd';
import React from 'react';
import dayjs from 'dayjs';

/** Custom widgets */

const CustomCheckbox = function (props) {
  return (
    <Switch
      id={props.id}
      style={{ marginTop: 0, marginBottom: 0, float: 'right' }}
      size={'small'}
      checkedChildren={'ON'}
      unCheckedChildren={'OFF'}
      disabled={props.disabled}
      checked={props.value}
      onClick={() => {
        if (!props.readonly) props.onChange(!props.value);
      }}
    />
  );
};

const CustomInputNumber = function (props) {
  return (
    <InputNumber
      id={props.id}
      style={{ float: 'right' }}
      disabled={props.disabled}
      role={'textbox'}
      min={
        props.schema.minimum || props.schema.minimum === 0
          ? props.schema.minimum
          : Number.MIN_SAFE_INTEGER
      }
      max={
        props.schema.maximum ? props.schema.maximum : Number.MAX_SAFE_INTEGER
      }
      defaultValue={props.value}
      value={props.value}
      size={'small'}
      onChange={value => {
        if (!props.readonly) props.onChange(value);
      }}
    />
  );
};

const CustomText = function (props) {
  if (props.schema.type === 'integer') {
    if (
      props.schema.maximum &&
      (props.schema.minimum || props.schema.minimum === 0)
    ) {
      let percent;
      if (
        props.schema.maximum === 100 &&
        (props.schema.minimum === 0 || props.schema.minimum === 1)
      )
        percent = true;

      if (
        (props.schema.maximum <= 100 || props.schema.maximum >= 0) &&
        (props.schema.minimum >= 0 || props.schema.minimum <= 100)
      ) {
        return (
          <Row>
            <Col span={19}>
              <Slider
                id={props.id}
                disabled={props.disabled}
                min={props.schema.minimum}
                max={props.schema.maximum}
                onChange={value => {
                  if (!props.readonly) props.onChange(value);
                }}
                value={
                  typeof props.value === 'number'
                    ? props.value
                    : props.schema.minimum
                }
              />
            </Col>
            <Col span={5}>
              <InputNumber
                style={{ float: 'right' }}
                disabled={props.disabled}
                role={'textbox'}
                formatter={value => (percent ? `${value}%` : value)}
                parser={value => value.replace('%', '')}
                size={'small'}
                min={props.schema.minimum}
                max={props.schema.maximum}
                value={
                  typeof props.value === 'number'
                    ? props.value
                    : props.schema.minimum
                }
                onChange={value => {
                  if (!props.readonly) props.onChange(value);
                }}
              />
            </Col>
          </Row>
        );
      }
    }
    return CustomInputNumber(props);
  } else if (props.schema.type === 'number') {
    return CustomInputNumber(props);
  }
  return (
    <Input
      id={props.id}
      defaultValue={props.value}
      value={props.value}
      disabled={props.disabled}
      role={'textbox'}
      size={'small'}
      onChange={({ target }) => {
        if (!props.readonly) props.onChange(target.value);
      }}
    />
  );
};

const CustomDateTime = function (props) {
  return (
    <DatePicker
      showTime
      style={{ marginTop: 0, marginBottom: 0, float: 'right', width: '100%' }}
      id={props.id}
      value={dayjs(props.value)}
      disabled={props.disabled}
      role={'date-picker'}
      onChange={value => {
        if (!props.readonly) props.onChange(value.toISOString());
      }}
    />
  );
};

export const widgets = {
  CheckboxWidget: CustomCheckbox,
  TextWidget: CustomText,
  DateTimeWidget: CustomDateTime
};
