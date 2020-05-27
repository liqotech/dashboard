import React, { Component } from 'react';
import './NewCR.css';
import { Tabs, Typography, Button, notification } from 'antd';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import { APP_NAME } from '../constants';
import FormGenerator from './OAPIV3FormGenerator/FormGenerator';

const { Title } = Typography;

class NewCR extends Component {
  constructor(props) {
    super(props);

    // Return to CRD page if accessed not from the CRD page
    if(!this.props.location.state.CRD) {
      this.props.history.push("/customresources/" + this.props.match.params.crdName);
    }

    this.state = {
      value: '',
      schema_object: null,
      isLoading: false
    };
    this.CRD = this.props.location.state.CRD;
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
    this.submit = this.submit.bind(this);
  }

  onClick() {
    let item;

    try {
      item = JSON.parse(this.state.value);
    } catch (error) {
      item = YAML.parse(this.state.value);
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

    let promise = this.props.api.createCustomResource(
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
        this.props.history.push("/customresources/" + this.props.match.params.crdName);
        notification.success({
          message: APP_NAME,
          description: 'Resource created'
        });
      })
      .catch(() => {
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
          width="100%"
        />
        <div style={{marginTop: 20}}>
          <Button onClick={this.onClick} style={{width: "20%"}}>OK</Button>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className="new-cr-content">
        <Title level={4} >
          {"Create a new " + this.CRD.spec.names.kind + " resource"}
        </Title>
        { !this.state.isLoading ? (
            <Tabs>
              <Tabs.TabPane tab="JSON/YAML" key="1">
                {this.inputText()}
              </Tabs.TabPane>
              <Tabs.TabPane tab="Easy version (WIP)" key="2">
                {/*this.formGenerator()*/}
                <FormGenerator CRD={this.CRD} submit={this.submit}/>
              </Tabs.TabPane>
            </Tabs>
          ) : null }
        { this.state.isLoading ? <LoadingIndicator /> : null }
      </div>
    );
  }
}

export default NewCR;
