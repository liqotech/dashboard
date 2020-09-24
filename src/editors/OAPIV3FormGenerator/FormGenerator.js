import React, { Component } from 'react';
import Utils from '../../services/Utils';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import { Button, Card, message, Typography } from 'antd';
import { widgets } from './CustomWidget';
import {  fields } from './CustomField';
import CustomFieldTemplate from './CustomFieldTemplate';
import { json } from 'generate-schema';

const Form = withTheme(AntDTheme);

function FormGenerator(props) {
  const util = Utils();
  let schema = util.OAPIV3toJSONSchema(props.CRD.spec.validation.openAPIV3Schema).properties.spec;
  let currentMetadata = {};

  const onSubmit = value => {
    if(!props.onUpdate){
      let metadata = currentMetadata;

      if(!metadata || !metadata.name || metadata.name === ''){
        message.error('Please insert a valid name');
        return;
      }

      let item = {
        spec: value.formData,
        metadata: metadata,
        apiVersion: props.CRD.spec.group + '/' + props.CRD.spec.version,
        kind: props.CRD.spec.names.kind
      }
      props.submit(item);
    } else{
      props.submit(value.formData);
    }
  }

  let metadata = {
    name: ''
  }

  if(props.CRD.spec.scope !== 'Cluster'){
    metadata.namespace = '';
  }

  return(
    <div style={{marginLeft: 10, marginRight: 10, marginBottom: 10}}>
      { !props.onUpdate ? (
        <Card size="small" type="inner"
              title={<Typography.Text strong>Metadata</Typography.Text>}
              style={{marginBottom: 10}}
        >
          <Form
            schema={json(metadata)}
            fields={fields}
            FieldTemplate={CustomFieldTemplate}
            widgets={widgets}
            onChange={(value) => {currentMetadata = value.formData}}
          >
            <div/>
          </Form>
        </Card>
      ) : null}
      <Form
        schema={schema}
        formData={props.onUpdate ? props.CR.spec : null}
        fields={fields}
        FieldTemplate={CustomFieldTemplate}
        widgets={widgets}
        onSubmit={onSubmit}
      >
        <Button type="primary" htmlType={'submit'} style={{marginTop: 10}}>Submit</Button>
      </Form>
    </div>
  )
}

export default FormGenerator;
