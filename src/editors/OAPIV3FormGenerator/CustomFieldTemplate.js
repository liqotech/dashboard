import React from 'react';
import { Badge, Col, Collapse, Input, Row, Tooltip, Typography } from 'antd';
import { rootSplitCamelCaseAndUp, splitCamelCaseAndUp } from '../../services/stringUtils';
import { QuestionCircleOutlined } from '@ant-design/icons';
import ReferenceHandler from './ReferenceHandler';

export function checkChildren(props){
  if(!props.schema.properties)
    return false;

  let i = 0;
  Object.keys(props.schema.properties).forEach(item => {
    if(props.schema.properties[item].type === 'object' ||
      props.schema.properties[item].type === 'array')
      i++;
  })
  return i === 0 || i === Object.keys(props.schema.properties).length;
}


function customObject(props){
  return (
    <div className={props.classNames} id={props.id} style={{ marginBottom: 5, marginTop: 5 }}>
      <Collapse defaultActiveKey={props.id === 'root' ? ('collapse_' + props.id) : null}>
        <Collapse.Panel
          key={'collapse_' + props.id}
          header={ <div>
            {props.label ? <Typography.Text strong>
              {splitCamelCaseAndUp(props.label)}
              {props.schema.description ? (
                <Tooltip placement="top" title={props.schema.description}>
                  <QuestionCircleOutlined style={{ marginLeft: 5 }}/>
                </Tooltip>
              ) : null}
            </Typography.Text> : <Typography.Text strong>General</Typography.Text>}
          </div>}
        >
          { props.children }
        </Collapse.Panel>
      </Collapse>
      {props.errors}
    </div>
  )
}

export function customFieldTemplateGeneral(props, onViewer){
  const { id, classNames, label, errors, children } = props;

  if (!props.schema.type && !label) {
    return (
      <div id={id}>
        {children}
        {errors}
      </div>
    )
  }

  if (props.schema.type === 'object' || !props.schema.type) {

    if(checkChildren(props) && !label){
      return (
        <div id={id}>
          {children}
          {errors}
        </div>
      )
    } else {
      /** An object reference is like this: group/kindRef */
      if(label && label.slice(-3) === 'Ref' && label.split('/')[1]){
        return <ReferenceHandler {...props} onViewer={onViewer} />
      }
      return customObject(props);
    }
  } else if (props.schema.type === 'array') {
    return (
      <div className={classNames} id={id} style={{ marginBottom: 5, marginTop: 5 }}>
        <Collapse defaultActiveKey={id === 'root' ? ('collapse_' + id) : null}>
          <Collapse.Panel
            key={'collapse_' + id}
            header={ <div>
              {label ? <Typography.Text strong>
                {splitCamelCaseAndUp(label)}
                {props.schema.description ? (
                  <Tooltip placement="top" title={props.schema.description}>
                    <QuestionCircleOutlined style={{ marginLeft: 5 }}/>
                  </Tooltip>
                ) : null}
              </Typography.Text> : <Typography.Text strong>General</Typography.Text>}
            </div>}
          >
            {children}
          </Collapse.Panel>
        </Collapse>
        {errors}
      </div>
    )
  }else{
    return false;
  }
}

function CustomFieldTemplate(props){
  const { id, classNames, label, required, errors, children } = props;

  let render = customFieldTemplateGeneral(props);

  if(!render) {

    //TODO: fix additionalProperties
    if(props.schema.__additional_property){
      return(
        <div className={classNames} id={id} style={{ marginBottom: 5, marginTop: 5 }}>
          <Row align="middle">
            <Col span={10}>
              <div>
                <Input id={props.id + '-input'} defaultValue={props.label} value={props.label}
                       onChange={({ target }) => {if(!props.readonly) props.onKeyChange(target.value)}}/>
              </div>
            </Col>
            <Col span={14}>
              {children}
            </Col>
          </Row>
          {errors}
        </div>
      )
    }else{
      return (
        <div className={classNames} id={id} style={{ marginBottom: 5, marginTop: 5 }}>
          <Row align="middle">
            <Col span={10}>
              <div>
                {!required ? <Badge color={'blue'}/> : (
                  <Tooltip placement="top" title={'Field required'}>
                    <Badge color={'red'}/>
                  </Tooltip>
                )}
                {label ? <Typography.Text strong>{splitCamelCaseAndUp(label)}</Typography.Text> :
                  <Typography.Text strong>{rootSplitCamelCaseAndUp(id)}</Typography.Text>}
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
  } else {
    return render;
  }
}

export default CustomFieldTemplate;
