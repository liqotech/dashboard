import React, { useState } from 'react';
import Utils from '../../services/Utils';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import { Button, Card, message, Typography } from 'antd';
import { widgets } from './CustomWidget';
import {  fields } from './CustomField';
import CustomFieldTemplate from './CustomFieldTemplate';

const Form = withTheme(AntDTheme);

function FormGenerator(props) {
  const util = Utils();
  let schema = util.OAPIV3toJSONSchema(props.CRD.spec.validation.openAPIV3Schema).properties.spec;
  let [currentMetadata, setCurrentMetadata] = useState(() => {
    let formData = { name: '' }
    if(props.CRD.spec.scope !== 'Cluster'){
      formData.namespace = 'default'
    }
    return formData;
  });
  let [currentSpec, setCurrentSpec] = useState(() => props.onUpdate ? props.CR.spec : null);

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
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The name of the resource. It is a string that uniquely identifies this object within the current namespace (if the resource is namespaced).'
      }
    }
  }

  if(props.CRD.spec.scope !== 'Cluster'){
    metadata.properties.namespace = {
      type: 'string',
      description: 'The namespace of the resource. A namespace is a DNS compatible label that objects are subdivided into. The default namespace is \'default\'. '
    };
  }

  return(
    <div style={{marginLeft: 10, marginRight: 10, marginBottom: 10}}>
      { !props.onUpdate ? (
        <Card size="small" type="inner"
              title={<Typography.Text strong>Metadata</Typography.Text>}
              style={{marginBottom: 10}}
        >
          <Form
            formData={currentMetadata}
            schema={metadata}
            fields={fields}
            FieldTemplate={CustomFieldTemplate}
            widgets={widgets}
            onChange={(value) => {setCurrentMetadata(value.formData)}}
          >
            <div/>
          </Form>
        </Card>
      ) : null}
      <Form
        schema={schema}
        formData={currentSpec}
        fields={fields}
        FieldTemplate={CustomFieldTemplate}
        widgets={widgets}
        onSubmit={onSubmit}
        onChange={(value) => {setCurrentSpec(value.formData)}}
      >
        <Button type="primary" htmlType={'submit'} style={{marginTop: 10}}>Submit</Button>
      </Form>
    </div>
  )
}

export default FormGenerator;
