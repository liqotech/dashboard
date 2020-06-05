import React, { Component } from 'react';
import './DesignEditorCRD.css';
import { Typography, Button, notification, Layout, Menu, Divider, Row, Col, Steps } from 'antd';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import FormGenerator from './OAPIV3FormGenerator/FormGenerator';
import PieChart from '../templates/piechart/PieChart';
import HistoChart from '../templates/histogram/HistoChart';
import { APP_NAME } from '../constants';
import GraphNet from '../templates/graph/GraphNet';

const { Title } = Typography;
const { Step } = Steps;

class DesignEditorCRD extends Component {
  constructor(props) {
    super(props);

    // Return to CRD page if accessed not from the CRD page
    if (!this.props.api.kcc.apiServer) {
      this.props.history.push("/customresources/" + this.props.match.params.crdName);
    }

    this.state = {
      example_CR: null,
      schema_object: null,
      isLoading: true,
      templates: [],
      chosen_template: null,
      current: 0,
      save_enabled: false,
      CR_chosen_template: null,
      template_form:
        (
          <div style={{textAlign: 'center'}}>
            <Title level={4}>
              Please choose a template
            </Title>
          </div>
        ),
      preview:
        (
          <Title level={4} style={{textAlign: 'center'}}>
            Click Submit to see a preview
          </Title>
        )
    };
    if(this.props.location.state.CR) {
      this.state.example_CR = this.props.location.state.CR;
    }
    this.CRD = this.props.location.state.CRD;
    this.loadTemplates = this.loadTemplates.bind(this);
    this.onClick_design = this.onClick_design.bind(this);
    this.content = this.content.bind(this);
    this.submit = this.submit.bind(this);
    this.preview = this.preview.bind(this);
    this.onClick_save = this.onClick_save.bind(this);
  }

  loadTemplates(){

    if(this.props.location.state.CR) {
      this.setState({example_CR: this.props.location.state.CR});
    }

    this.setState({
      templates: this.props.api.getTemplates(),
      isLoading: false
    });

    //console.log(this.props.api.getTemplates());
  }

  componentDidMount() {
    if (this.props.api.kcc.apiServer) {
      this.loadTemplates();
    }
  }

  submit(CR_template){
    this.setState({CR_chosen_template: CR_template},
      () => {this.preview(CR_template)});
    this.setState({current: 2, save_enabled: true});
  }

  preview(CR_template) {
    if (this.state.chosen_template) {
      if (this.state.chosen_template.spec.names.kind === 'PieChart') {
        this.setState({
          preview: (
            <div>
              <Title level={4} style={{textAlign: 'center'}}>
                {'Showing preview for: ' + this.state.example_CR[0].metadata.name}
              </Title>
              <br/>
              <PieChart
                CR={this.state.example_CR[0].spec}
                template={CR_template}
              />
            </div>
          )})
      } else if (this.state.chosen_template.spec.names.kind === 'HistoChart') {
        this.setState({
          preview: (
            <div>
              <Title level={4} style={{textAlign: 'center'}}>
                {'Showing preview for: ' + this.state.example_CR[0].metadata.name}
              </Title>
              <br/>
              <HistoChart
                CR={this.state.example_CR[0].spec}
                template={CR_template}
              />
            </div>
          )})
      } else if (this.state.chosen_template.spec.names.kind === 'Graph') {
        this.setState({
          preview: (
            <GraphNet custom_resources={this.state.example_CR}
                      template={CR_template}
            />
          )})
      } else {
        this.setState({
        preview: (
          <Title level={4} style={{marginLeft: 10}}>
            No preview supported for this template :(
          </Title>
        )})
      }
    } else {
      this.setState({
        preview: (
          <Title level={4} style={{marginLeft: 10}}>
            No resource to show
          </Title>
        )})
    }
  }

  content() {
    if(this.state.chosen_template){
      this.setState({
        template_form: (
          <div>
            <Title level={4} style={{marginLeft: 10}}>
              {this.state.chosen_template.spec.names.kind}
            </Title>
            <br/>
            <FormGenerator CRD={this.state.chosen_template} submit={this.submit}/>
          </div>
        ),
        preview:
          (
            <Title level={4} style={{textAlign: 'center'}}>
              Click Submit to see a preview
            </Title>
          )
      });
    } else{
      this.setState({
        template_form:
          (
            <div style={{textAlign: 'center'}}>
              <Title level={4}>
                Please choose a template
              </Title>
            </div>
          ),
        preview:
          (
            <Title level={4} style={{textAlign: 'center'}}>
              Click Submit to see a preview
            </Title>
          )
      });
    }
  }

  onClick_design(value){
    //console.log('183', this.props.api.getCRDfromKind(value.key))
    this.setState({chosen_template: this.props.api.getCRDfromKind(value.key)},
      () => {this.content()});
    this.setState({current: 1});
  }

  // modify the CRD and add a CR of the template
  onClick_save(){
    this.CRD.metadata.annotations.template = this.state.chosen_template.spec.group + '/' +
      this.state.chosen_template.spec.version + '/' +
      this.state.chosen_template.spec.names.plural + '/' +
      this.state.CR_chosen_template.metadata.name;

    //console.log(this.state.CR_chosen_template);

    this.props.api.createCustomResource(
      this.state.chosen_template.spec.group,
      this.state.chosen_template.spec.version,
      this.state.CR_chosen_template.metadata.namespace,
      this.state.chosen_template.spec.names.plural,
      this.state.CR_chosen_template).then(() => {
      // this.props.history.push("/customresources/" + this.props.match.params.crdName);
      notification.success({
        message: APP_NAME,
        description: 'New Resource created'
      });
      }
    ).catch((error) => {
      console.log(error);
      notification.error({
        message: APP_NAME,
        description: 'Could not create the resource'
      });
    }).then(() => {
        this.props.api.updateCustomResourceDefinition(
          this.props.match.params.crdName,
          this.CRD
        ).then(() => {
          this.props.history.push("/customresources/" + this.props.match.params.crdName);
          notification.success({
            message: APP_NAME,
            description: 'CRD modified'
          });
        }).catch((error) => {
          console.log(error);
          notification.error({
            message: APP_NAME,
            description: 'Could not modify the CRD'
          });
        })
      }
    )
  }

  render() {
    if (this.state.isLoading){
      return <LoadingIndicator/>
    }
    else {
      const options = [];
      this.state.templates.forEach(item => {
        options.push(
          <Menu.Item key={item.kind} onClick={this.onClick_design}>
            {item.kind}
          </Menu.Item>
        );
      })

      return (
        <div className="rep-crd-content">
          <Title level={4}>
            {'Choose the design for: ' + this.CRD.spec.names.kind}
          </Title>
          <Divider/>
          <Layout style={{background: '#fff'}}>
            <Layout.Content>
              <Row justify="space-around" align="middle">
                <Col span={11}>
                  {this.state.template_form}
                </Col>
                <Col span={1}>
                  <Divider type="vertical" style={{minHeight: 400}}/>
                </Col>
                <Col span={12}>
                  {this.state.preview}
                </Col>
              </Row>
            </Layout.Content>
            <Layout.Sider style={{background: '#fff'}}>
              <Menu mode="vertical-right">
                {options}
              </Menu>
            </Layout.Sider>
          </Layout>
          <Divider/>
          <Steps current={this.state.current}>
            <Step title="Select design" />
            <Step title="Submit values" />
            <Step title={
              <Button disabled={!this.state.save_enabled}
                      type="primary" style={{width: 200}}
                      onClick={this.onClick_save}
              >
                Save it
              </Button>
            } />
          </Steps>
        </div>
      )
    }
  }
}

export default DesignEditorCRD;
