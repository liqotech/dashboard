import React, { Component } from 'react';
import './NewCR.css';
import { Tabs, Typography, Button, notification, message, Drawer, Badge } from 'antd';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import { APP_NAME } from '../constants';
import FormGenerator from './OAPIV3FormGenerator/FormGenerator';
import ReactResizeDetector from 'react-resize-detector';

class NewCR extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
      schema_object: null,
      isLoading: false,
      editorWidth: "auto"
    };
    this.CRD = this.props.CRD;
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

    if(!item || !item.metadata || item.metadata.name === ''){
      message.error('Errors in the custom resource definition');
      return;
    }

    this.submit(item);
  }

  submit(item){
    let namespace = '';

    if(this.CRD.spec.scope === 'Namespaced'){
      namespace = 'default';
    }

    this.setState({isLoading: true});

    if(item.metadata.namespace) {
      namespace = item.metadata.namespace;
    }

    let promise = window.api.createCustomResource(
      this.CRD.spec.group,
      this.CRD.spec.version,
      namespace,
      this.CRD.spec.names.plural,
      item
    );

    promise
      .then(() => {
        this.setState({
          isLoading: false
        });
        notification.success({
          message: APP_NAME,
          description: 'Resource created'
        });
        this.props.this.setState({showCreate: false});
      })
      .catch((error) => {
        //console.log(error);
        this.setState({
          isLoading: false
        });
        notification.error({
          message: APP_NAME,
          description: 'Could not create the resource'
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
          showPrintMargin={true}
          showGutter={true}
          onChange={this.onChange}
          highlightActiveLine={true}
          showLineNumbers={true}
          tabSize={2}
          width={this.state.editorWidth}
          height="75vh"
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
            { this.CRD.spec.validation && this.CRD.spec.validation.openAPIV3Schema ? (
              <Tabs.TabPane tab="Form Wizard" key="2">
                <FormGenerator CRD={this.CRD} submit={this.submit}/>
              </Tabs.TabPane>
            ) : null}
          </Tabs>
        ) : null }
        { this.state.isLoading ? <LoadingIndicator /> : null }
      </div>
    );
  }
}

export default NewCR;
