import React, { Component } from 'react';
import './DesignEditorCRD.css';
import {
  Typography, Button, notification, Layout, Menu,
  Divider, Row, Col, Steps, Carousel, Tabs, Card, Empty
} from 'antd';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import FormGenerator from './OAPIV3FormGenerator/FormGenerator';
import PieChart from '../templates/piechart/PieChart';
import HistoChart from '../templates/histogram/HistoChart';
import { APP_NAME } from '../constants';
import GraphNet from '../templates/graph/GraphNet';
import ReactResizeDetector from 'react-resize-detector';
import JsonToTableAntd from './JsonToTable/JsonToTableAntd';

const { Title } = Typography;
const { Step } = Steps;

class DesignEditorCRD extends Component {
  constructor(props) {
    super(props);

    this.state = {
      example_CR: null,
      schema_object: null,
      isLoading: true,
      templates: [],
      chosen_template: null,
      currentStep: 0,
      currentTab: '0',
      save_enabled: false,
      CR_chosen_template: null,
      editorWidth: "auto",
      disabledTab: false,
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

    this.state.example_CR = this.props.CR;
    this.CRD = this.props.CRD;
    this.loadTemplates = this.loadTemplates.bind(this);
    this.onClick_design = this.onClick_design.bind(this);
    this.content = this.content.bind(this);
    this.submit = this.submit.bind(this);
    this.preview = this.preview.bind(this);
    this.onClick_save = this.onClick_save.bind(this);
  }

  loadTemplates(){
    if(this.props.CR) {
      this.setState({example_CR: this.props.CR});
    }

    this.setState({
      templates: this.props.api.getTemplates(),
      isLoading: false
    });
  }

  componentDidMount() {
    this.loadTemplates();
  }

  submit(CR_template){
    this.setState({CR_chosen_template: CR_template},
      () => {this.preview(CR_template)});
    this.setState({currentStep: 2, save_enabled: true});
    this.changeTab("2");
  }

  preview(CR_template) {
    if(CR_template === 'default' && this.state.example_CR[0]){
      this.setState({
        preview: (
          <JsonToTableAntd json={this.state.example_CR[0].spec} />
        )
      })
    }
    else if (this.state.chosen_template && this.state.example_CR[0]) {
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
          <Empty key={'empty_preview'} description={<strong>No resource to show</strong>}/>
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
    if(value === 'default'){
      this.setState({currentStep: 2, save_enabled: true, disabledTab: true});
      this.changeTab("2");
      this.setState({CR_chosen_template: 'default'},
        () => {this.preview('default')});
    } else {
      this.setState({chosen_template: this.props.api.getCRDfromKind(value)},
        () => {this.content()});
      this.setState({
        currentStep: 1,
      });
      this.changeTab("1");
    }
  }

  // modify the CRD and add a CR of the template
  onClick_save(){
    if(this.state.CR_chosen_template !== 'default'){
      this.CRD.metadata.annotations.template = this.state.chosen_template.spec.group + '/' +
        this.state.chosen_template.spec.version + '/' +
        this.state.chosen_template.spec.names.plural + '/' +
        this.state.CR_chosen_template.metadata.name;

      this.props.api.createCustomResource(
        this.state.chosen_template.spec.group,
        this.state.chosen_template.spec.version,
        this.state.CR_chosen_template.metadata.namespace,
        this.state.chosen_template.spec.names.plural,
        this.state.CR_chosen_template).then(() => {
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
            this.CRD.metadata.name,
            this.CRD
          ).then(() => {
            notification.success({
              message: APP_NAME,
              description: 'CRD modified'
            });
            this.setState({
              currentStep: 0,
              currentTab: '0',
              save_enabled: false,
            })
            this.props.this.setState({showEditor: false});
          }).catch((error) => {
            console.log(error);
          })
        }
      )
    } else {
      this.CRD.metadata.annotations.template = null;
      this.props.api.updateCustomResourceDefinition(
        this.CRD.metadata.name,
        this.CRD
      ).then(() => {
        notification.success({
          message: APP_NAME,
          description: 'CRD modified'
        });
        this.setState({
          currentStep: 0,
          currentTab: '0',
          save_enabled: false,
        })
        this.props.this.setState({showEditor: false});
      }).catch((error) => {
        console.log(error);
      })
    }
  }

  changeTab = activeKey => {
    // console.log(118, activeKey);
    this.setState({
      currentTab: activeKey
    });
  };

  render() {
    if (this.state.isLoading){
      return <LoadingIndicator/>
    }
    else {
      const options = [];
      this.state.templates.forEach(item => {
        //console.log(item.kind);
        if(item.kind !== 'LiqoDashTest'){
          options.push(
            <Card.Grid key={item.kind}
                       style={{width: '45%', textAlign: 'center',
                         marginLeft: 15, marginRight: 15,
                         marginTop: 15, marginBottom: 15}}
                       onClick={() => {this.onClick_design(item.kind)}}>
              {item.kind}
            </Card.Grid>
          );
        }
      })

      options.push(
        <Card.Grid key={'default'}
                   style={{width: '45%', textAlign: 'center',
                     marginLeft: 15, marginRight: 15,
                     marginTop: 15, marginBottom: 15}}
                   onClick={() => {this.onClick_design('default')}}>
          Default
        </Card.Grid>
      )

      return (
        <div>
          <ReactResizeDetector handleWidth
                               onResize={(w) => {this.setState({
                                 editorWidth: w
                               })}}/>
          <div style={{marginBottom: 100}}>
            <Tabs type="card" animated activeKey={this.state.currentTab} onChange={this.changeTab}>
              <Tabs.TabPane tab={'Template'} key={"0"}>
                <Card bordered={false}>
                  {options}
                </Card>
              </Tabs.TabPane>
              <Tabs.TabPane tab={'Form'} key={"1"} disabled={this.state.disabledTab}>
                {this.state.template_form}
              </Tabs.TabPane>
              <Tabs.TabPane tab={'Preview'} key={"2"}>
                {this.state.preview}
              </Tabs.TabPane>
            </Tabs>
          </div>
          <div style={{
            width: this.state.editorWidth, position: 'fixed',
            bottom: 0, backgroundColor: '#fff', paddingBottom: 30
          }}>
            <Divider style={{marginTop: 4}}/>
            <Steps current={this.state.currentStep}>
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
        </div>
      )
    }
  }
}

export default DesignEditorCRD;
