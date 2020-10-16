import React, { useEffect, useState } from 'react';
import './DesignEditorCRD.css';
import {
  Alert,
  Typography, Button, message,
  Divider, Steps, Tabs, Card, Empty, Badge, Drawer
} from 'antd';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import FormGenerator from '../OAPIV3FormGenerator/FormGenerator';
import PieChart from '../../templates/piechart/PieChart';
import HistoChart from '../../templates/histogram/HistoChart';
import GraphNet from '../../templates/graph/GraphNet';
import FormViewer from '../OAPIV3FormGenerator/FormViewer';

function DesignEditorCRD(props) {
  const [chosenTemplate, setChosenTemplate] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTab, setCurrentTab] = useState('0');
  const [saveEnabled, setSaveEnabled] = useState(false);
  const [CRChosenTemplate, setCRChosenTemplate] = useState(null);
  const [disabledTab, setDisabledTab] = useState(false);
  const [templateForm, setTemplateForm] = useState(
    <Alert message={'No template selected'}
           description={'Please choose a template'}
           type={'warning'}
           showIcon
    />
  );
  const [preview, setPreview] = useState(
    <Alert message={'No template submitted'}
           description={'Please submit a template'}
           type={'warning'}
           showIcon
    />
  );
  const templates = window.api.getTemplates();

  const submit = CRTemplate => {
    setCRChosenTemplate(CRTemplate);
    previewFunction(CRTemplate);
    setCurrentStep(2);
    setSaveEnabled(true);
    changeTab("2");
  }

  useEffect(() => {
    content();
  }, [chosenTemplate])

  const previewFunction = CRTemplate => {
    if(CRTemplate === 'default' && props.CR[0]){
      setPreview(
        <FormViewer resource={props.CR[0]} CRD={props.CRD} onEditor={true} show={'spec'}
                    resourceName={props.CR[0].metadata.name}
                    resourceNamespace={props.CR[0].metadata.namespace}
        />
      );
    }
    else if (chosenTemplate && props.CR[0]) {
      if (chosenTemplate.spec.names.kind === 'PieChart') {
        setPreview(
          <div>
            <Typography.Title level={4} style={{textAlign: 'center'}}>
              {'Showing preview for: ' + props.CR[0].metadata.name}
            </Typography.Title>
            <br/>
            <PieChart
              CR={props.CR[0].spec}
              template={CRTemplate}
            />
          </div>
        );
      } else if (chosenTemplate.spec.names.kind === 'HistoChart') {
        setPreview(
          <div>
            <Typography.Title level={4} style={{textAlign: 'center'}}>
              {'Showing preview for: ' + props.CR[0].metadata.name}
            </Typography.Title>
            <br/>
            <HistoChart
              CR={props.CR[0].spec}
              template={CRTemplate}
            />
          </div>
        );
      } else if (chosenTemplate.spec.names.kind === 'Graph') {
        setPreview(
          <GraphNet customResources={props.CR}
                    template={CRTemplate}
                    CRD={props.CRD}
          />
        );
      }
    } else {
      setPreview(
        <Empty key={'empty_preview'} description={<strong>No resource to show</strong>}/>
      );
    }
  }

  const content = () => {
    if(chosenTemplate){
      setTemplateForm(
        <div>
          <Typography.Title level={4} style={{marginLeft: 10}}>
            {chosenTemplate.spec.names.kind}
          </Typography.Title>
          <br/>
          <FormGenerator CRD={chosenTemplate} submit={submit}/>
        </div>
      );
      setPreview(
        <Alert message={'No template submitted'}
               description={'Please submit a template'}
               type={'warning'}
               showIcon
        />
      );
    } else{
      setTemplateForm(
        <Alert message={'No template selected'}
               description={'Please choose a template'}
               type={'warning'}
               showIcon
        />
      );
      setPreview(
        <Alert message={'No template submitted'}
               description={'Please submit a template'}
               type={'warning'}
               showIcon
        />
      );
    }
  }

  const onClick_design = value => {
    if(value === 'default'){
      setCurrentStep(2);
      setSaveEnabled(true);
      setDisabledTab(true);
      changeTab('2');
      setCRChosenTemplate('default');
      previewFunction('default');
    } else {
      setChosenTemplate(window.api.getCRDFromKind(value));
      setCurrentStep(1);
      changeTab('1');
    }
  }

  /** Modify the CRD and add a CR of the template */
  const onClick_save = () => {
    if(CRChosenTemplate !== 'default'){
      props.CRD.metadata.annotations.template = chosenTemplate.spec.group + '/' +
        chosenTemplate.spec.version + '/' +
        chosenTemplate.spec.names.plural + '/' +
        CRChosenTemplate.metadata.name;

      window.api.createCustomResource(
        chosenTemplate.spec.group,
        chosenTemplate.spec.version,
        CRChosenTemplate.metadata.namespace,
        chosenTemplate.spec.names.plural,
        CRChosenTemplate)
        .then(() => {
          message.success('New Resource created');
        }
      ).catch((error) => {
        console.log(error);
        message.error('Could not create the resource');
      }).then(() => {
          window.api.updateCustomResourceDefinition(
            props.CRD.metadata.name,
            props.CRD
          ).then(() => {
            message.success('CRD modified');
            setCurrentStep(0);
            setCurrentTab('0');
            setSaveEnabled(false);
            props.setShowEditor(false);
          }).catch((error) => {
            console.log(error);
            message.error('Could not update the resource');
          })
        }
      )
    } else {
      props.CRD.metadata.annotations.template = null;
      window.api.updateCustomResourceDefinition(
        props.CRD.metadata.name,
        props.CRD
      ).then(() => {
        message.success('CRD modified');
        setCurrentStep(0);
        setCurrentTab('0');
        setSaveEnabled(false);
        props.setShowEditor(false);
      }).catch((error) => {
        console.log(error);
        message.error('Could not update the CRD')
      })
    }
  }

  const changeTab = activeKey => {
    setCurrentTab(activeKey);
  };

  const options = [];
  templates.forEach(item => {
    if(item.kind !== 'LiqoDashTest'){
      options.push(
        <Card.Grid key={item.kind}
                   style={{width: '45%', textAlign: 'center',
                     marginLeft: 15, marginRight: 15,
                     marginTop: 15, marginBottom: 15}}
                   onClick={() => {onClick_design(item.kind)}}>
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
               onClick={() => {onClick_design('default')}}>
      Default
    </Card.Grid>
  )

  return (
    <Drawer
      title={
        <Badge status="processing"
               text={'Customize the design for: ' + props.CRD.spec.names.kind}
        />
      }
      placement={'right'}
      visible={props.showEditor}
      onClose={() => {props.setShowEditor(false)}}
      width={window.innerWidth > 900 ? 700 : window.innerWidth - 200}
      destroyOnClose
      footer={
        <div aria-label={'steps'}>
          <Steps current={currentStep}>
            <Steps.Step title="Select design" />
            <Steps.Step title="Submit values" />
            <Steps.Step title={
              <Button disabled={!saveEnabled}
                      type="primary" style={{width: 200}}
                      onClick={onClick_save}
              >
                Save it
              </Button>
            } />
          </Steps>
        </div>
      }
    >
      <div style={{marginBottom: 100}}>
        <Tabs type="card" animated activeKey={currentTab} onChange={changeTab}>
          <Tabs.TabPane tab={'Template'} key={"0"}>
            <Card bordered={false}>
              {options}
            </Card>
          </Tabs.TabPane>
          <Tabs.TabPane tab={'Form'} key={"1"} disabled={disabledTab}>
            {templateForm}
          </Tabs.TabPane>
          <Tabs.TabPane tab={'Preview'} key={"2"}>
            {preview}
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Drawer>
  )
}

export default DesignEditorCRD;
