import React, { Component } from 'react';
import './UpdateCR.css';
import { Tabs, Typography, Button, notification } from 'antd';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import { APP_NAME } from '../constants';

const { Title } = Typography;

class UpdateCR extends Component {
  constructor(props) {
    super(props);

    // Return to CRD page if accessed not from the CRD page
    if(!this.props.location.state.CR) {
      this.props.history.push("/customresources/" + this.props.match.params.crdName);
    }

    this.CR = this.props.location.state.CR;
    this.state = {
      value: JSON.stringify(this.CR.spec, null, 2),
      isLoading: false
    };
    // this.spec = this.CRD.spec.validation.openAPIV3Schema.properties.spec;
    this.requiredFields = [];
    this.onChange = this.onChange.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onClick() {
    let item;

    try {
      item = JSON.parse(this.state.value);
    } catch(error) {
      item = YAML.parse(this.state.value);
    }

    item = {
      spec: item
    }

    this.setState({isLoading: true});

    let promise = this.props.api.updateCustomResource(
      this.props.location.state.group,
      this.props.location.state.version,
      this.CR.metadata.namespace,
      this.props.location.state.plural,
      this.props.match.params.crName,
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
      <div className="update-cr-content">
        <Title level={4} >
          {"Update " + this.props.match.params.crName}
        </Title>
        { !this.state.isLoading ? (
            <Tabs>
              <Tabs.TabPane tab="JSON/YAML" key="1">
                {this.inputText()}
              </Tabs.TabPane>
            </Tabs>
          ) : null }
        { this.state.isLoading ? <LoadingIndicator /> : null }
      </div>
    );
  }
}

export default UpdateCR;
