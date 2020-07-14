import { Badge, Card, Col, Divider, Row, Tooltip, Typography } from 'antd';
import { splitCamelCaseAndUp } from '../../services/stringUtils';
import { QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';

/** Custom field template */

export function CustomFieldTemplate(props) {
  const { id, classNames, label, help, required, description, errors, children } = props;
  //console.log(props);
  if (props.schema.type === 'object') {
    return (
      <div className={classNames} id={id} style={{ marginBottom: 10 }}>
        <div>
          {label ? <Typography.Title level={4}>
            {splitCamelCaseAndUp(label)}
            {props.schema.description ? (
              <Tooltip placement="top" title={props.schema.description}>
                <QuestionCircleOutlined style={{ marginLeft: 5 }}/>
              </Tooltip>
            ) : null}
          </Typography.Title> : null}
        </div>
        {children}
        {errors}
      </div>
    )
  } else if (props.schema.type === 'array') {
    return (
      <div className={classNames} id={id} style={{ marginBottom: 10 }}>
        <div>
          {label ? <Typography.Title level={4}>
            {splitCamelCaseAndUp(label)}
            {props.schema.description ? (
              <Tooltip placement="top" title={props.schema.description}>
                <QuestionCircleOutlined style={{ marginLeft: 5 }}/>
              </Tooltip>
            ) : null}
          </Typography.Title> : null}

        </div>
        {children}
        {errors}
      </div>
    )
  } else {
    return (
      <div className={classNames} id={id} style={{ marginBottom: 10 }}>
        <Row>
          <Col span={10}>
            <div>
              {!required ? <Badge status="processing"/> : (
                <Tooltip placement="top" title={'Field required'}>
                  <Badge status="processing" color={'red'}/>
                </Tooltip>
              )}
              {label ? <Typography.Text strong>{splitCamelCaseAndUp(label)}</Typography.Text> : null}
              {props.schema.description ? (
                <Tooltip placement="top" title={props.schema.description}>
                  <QuestionCircleOutlined style={{ marginLeft: 5 }}/>
                </Tooltip>
              ) : null}
            </div>
          </Col>
          <Col span={14}>
            {children}
          </Col>
        </Row>
        {errors}
      </div>
    );
  }
}

const CustomTitleField = function() {
  return (
    <div></div>
  )
}

const CustomDescriptionFields = function() {
  return (
    <div></div>
  )
}

export const fields = {
  TitleField: CustomTitleField,
  DescriptionField: CustomDescriptionFields
};
