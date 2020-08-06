import React, { Component } from 'react';
import './UpdateCR.css';
import { Tabs, Typography, Button, notification, message, Alert } from 'antd';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import ReactResizeDetector from 'react-resize-detector';
import { APP_NAME } from '../constants';
import FormGenerator from './OAPIV3FormGenerator/FormGenerator';

class UpdateCR extends Component {
  constructor(props) {
    super(props);

    this.CR = this.props.CR;
    this.state = {
      value: JSON.stringify(this.CR.spec, null, 2),
      isLoading: false,
      editorWidth: "auto"
    };
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.submit = this.submit.bind(this);
  }

  onClick() {
    let item = undefined;

    try {
      item = JSON.parse(this.state.value);
    } catch(error) {
      try {
        item = YAML.parse(this.state.value);
      } catch(error){
         message.error('JSON or YAML not valid');
         return;
      }
    }

    this.submit(item);
  }

  submit(item){
    item = {
      spec: item
    }

    this.setState({isLoading: true});

    let promise = this.props.api.updateCustomResource(
      this.props.group,
      this.props.version,
      this.CR.metadata.namespace,
      this.props.plural,
      this.props.CR.metadata.name,
      item
    );

    promise
      .then(() => {
        this.setState({
          isLoading: false
        });
        this.props.this.setState({showUpdate: false});
        notification.success({
          message: APP_NAME,
          description: 'Resource updated'
        });
      })
      .catch(() => {
        this.setState({
          isLoading: false
        });
        notification.error({
          message: APP_NAME,
          description: 'Could not update the resource'
        });
      });
  }

  onChange(value) {
    this.setState({value: value});
  }

  inputText() {
    return(
      <div>
        <ReactResizeDetector handleWidth
                             onResize={(w) => {this.setState({
                               editorWidth: w + 'px'
                             })}}/>
        <AceEditor
          mode="yaml"
          theme="monokai"
          fontSize={16}
          value={this.state.value}
          onChange={this.onChange}
          tabSize={2}
          height={'75vh'}
          width={this.state.editorWidth}
        />
        <div style={{marginTop: 20}}>
          <Button onClick={this.onClick} style={{width: "20%"}}>OK</Button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div>
        { !this.state.isLoading ? (
            <Tabs defaultActiveKey="2">
              <Tabs.TabPane tab="JSON/YAML" key="1">
                {this.inputText()}
              </Tabs.TabPane>
              { this.props.CRD.spec.validation && this.props.CRD.spec.validation.openAPIV3Schema ? (
                <Tabs.TabPane tab="Form Wizard" key="2">
                  <Alert.ErrorBoundary>
                    <FormGenerator CRD={this.props.CRD} submit={this.submit} CR={this.CR} onUpdate={true}/>
                  </Alert.ErrorBoundary>
                </Tabs.TabPane>
              ) : null}
            </Tabs>
          ) : null }
        { this.state.isLoading ? <LoadingIndicator /> : null }
      </div>
    );
  }
}

export default UpdateCR;
