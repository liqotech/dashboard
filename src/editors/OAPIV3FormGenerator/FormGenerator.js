import React, { Component } from 'react';
import Utils from '../../services/Utils';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-github';
import { Button, Card, message, Typography } from 'antd';
import { widgets } from './CustomWidget';
import {  fields } from './CustomField';
import CustomFieldTemplate from './CustomFieldTemplate';
import { json } from 'generate-schema';

const Form = withTheme(AntDTheme);

class FormGenerator extends Component {
  constructor(props) {
    super(props);
    this.state = {
      CRD: this.props.CRD
    };
    this.util = new Utils();
    this.schema = this.util.OAPIV3toJSONSchema(this.props.CRD.spec.validation.openAPIV3Schema).properties.spec;
    this.currentMetadata = {};
    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onSubmit(value) {
    if(!this.props.onUpdate){
      let metadata = this.currentMetadata;

      if(!metadata || !metadata.name || metadata.name === ''){
        message.error('Please insert a valid name');
        return;
      }

      let item = {
        spec: value.formData,
        metadata: metadata,
        apiVersion: this.props.CRD.spec.group + '/' + this.props.CRD.spec.version,
        kind: this.props.CRD.spec.names.kind
      }
      this.props.submit(item);
    } else{
      this.props.submit(value.formData);
    }
  }

  onChange(value) {
    this.value = value;
  }

  render() {
    let metadata = {
      name: ''
    }

    if(this.state.CRD.spec.scope !== 'Cluster'){
      metadata.namespace = '';
    }
    return(
      <div style={{marginLeft: 10, marginRight: 10, marginBottom: 10, minHeight: '80vh'}}>
        { !this.props.onUpdate ? (
          <Card size="small" type="inner"
                title={<Typography.Text strong>Metadata</Typography.Text>}
                style={{marginBottom: 10}}
          >
            <Form
              schema={json(metadata)}
              fields={fields}
              FieldTemplate={CustomFieldTemplate}
              widgets={widgets}
              onChange={(value) => {this.currentMetadata = value.formData}}
              >
              <div/>
            </Form>
          </Card>
        ) : null}
        <Form
          schema={this.schema}
          formData={this.props.onUpdate ? this.props.CR.spec : null}
          fields={fields}
          FieldTemplate={CustomFieldTemplate}
          widgets={widgets}
          onSubmit={this.onSubmit}
        >
          <Button type="primary" htmlType={'submit'} style={{marginTop: 10}}>Submit</Button>
        </Form>
      </div>
    )
  }
}

export default FormGenerator;
