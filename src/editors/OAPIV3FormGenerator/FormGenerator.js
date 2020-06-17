import React, { Component } from 'react';
import Utils from '../../services/Utils';
import { withTheme } from '@rjsf/core';
import { Theme } from './theme';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-github';
import { message } from 'antd';

const Form = withTheme(Theme);

class FormGenerator extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '{\n' + '  "name": "",\n' + '  "namespace": "",\n' + '}',
      CRD: this.props.CRD
    };
    this.util = new Utils();
    this.schema = this.util.OAPIV3toJSONSchema(this.props.CRD.spec.validation.openAPIV3Schema).properties.spec;
    this.value = '';
    this.onSubmit = this.onSubmit.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  onSubmit(value) {
    let metadata = undefined;

    try {
      metadata = JSON.parse(this.value);
    } catch(error) {
      try {
        metadata = YAML.parse(this.value);
      } catch(error) {
        message.error('JSON or YAML not valid');
        return;
      }
    }

    if(metadata.name === ''){
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
  }

  onChange(value) {
    this.value = value;
  }

  render() {

    return(
      <div style={{marginTop: 20, marginLeft: 10, marginRight: 10, marginBottom: 20, minHeight: '80vh'}}>
        <div>
          <div style={{marginBottom: 10}}>
            metadata
          </div>
          <AceEditor
            mode="yaml"
            theme="github"
            fontSize={16}
            value={this.state.value}
            showPrintMargin={true}
            showGutter={true}
            onChange={this.onChange}
            highlightActiveLine={true}
            showLineNumbers={true}
            tabSize={2}
            height="150px"
            width="100%"
          />
        </div>
        <br/>
        <Form
          schema={this.schema}
          onSubmit={this.onSubmit}
        />
      </div>
    )
  }
}

export default FormGenerator;
