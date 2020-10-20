import React from 'react';
import { Popconfirm, Badge, Button, Col, Row, Tooltip, Typography, InputNumber } from 'antd';
import { rootSplitCamelCaseAndUp, splitCamelCaseAndUp } from '../../services/stringUtils';
import { QuestionCircleOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import { customFieldTemplateGeneral } from './CustomFieldTemplate';

function CustomFieldTemplateViewer(props){
  const { id, classNames, label, required, errors, children } = props;

  let render = customFieldTemplateGeneral(props);

  if(!render){
    return (
      <div className={classNames} id={id} style={{ marginBottom: 5, marginTop: 5 }}>
        <Row align="middle">
          <Col span={10}>
            <div>
              {!props.disabled ? (
                <>
                  {!required ? <Badge color={'blue'}/> : (
                    <Tooltip placement="top" title={'Field required'}>
                      <Badge color={'red'}/>
                    </Tooltip>
                  )}
                </>
              ) : <Badge status="default"/>}
              {label ? <Typography.Text strong>{splitCamelCaseAndUp(label)}</Typography.Text> :
                <Typography.Text strong>{rootSplitCamelCaseAndUp(id)}</Typography.Text>}
              {props.schema.description ? (
                <Tooltip placement="top" title={props.schema.description}>
                  <QuestionCircleOutlined style={{ marginLeft: 5 }}/>
                </Tooltip>
              ) : null}
            </div>
          </Col>
          <Col span={13}>
            {children}
          </Col>
          <Col span={1} style={{textAlign: 'center'}}>
            {props.disabled ? (
              <Tooltip title={'Edit field'} placement={'top'}>
                <Button icon={<EditOutlined/>}
                        onClick={() => {
                          props.onDisableChange()
                        }}
                        size={'small'}
                />
              </Tooltip>
            ) : (
              <Popconfirm title={'Discard changes?'} placement={'top'}
                          onConfirm={() => {props.onDisableChange()}}
                          okText="Yes" cancelText="No"
              >
                <Button icon={<CloseOutlined />} htmlType={'submit'}/>
              </Popconfirm>
            )
            }
          </Col>
        </Row>
        {errors}
      </div>
    );
  } else {
    return render;
  }
}

export default CustomFieldTemplateViewer;
