import React, { useState } from 'react';
import './NewCR.css';
import { Tabs, Button, message } from 'antd';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import FormGenerator from './OAPIV3FormGenerator/FormGenerator';

function NewCR(props) {

  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [editorWidth] = useState('auto');

  const onClick = () => {
    let item;

    try {
      item = JSON.parse(value);
    } catch(error) {
      try {
        item = YAML.parse(value);
      } catch(error){
        message.error('JSON or YAML not valid');
        return;
      }
    }

    if(!item || !item.metadata || item.metadata.name === ''){
      message.error('Errors in the custom resource definition');
      return;
    }

    submit(item);
  }

  const submit = item => {
    let namespace = '';

    if(props.CRD.spec.scope === 'Namespaced'){
      namespace = 'default';
    }

    setLoading(true);

    if(item.metadata.namespace) {
      namespace = item.metadata.namespace;
    }

    let promise = window.api.createCustomResource(
      props.CRD.spec.group,
      props.CRD.spec.version,
      namespace,
      props.CRD.spec.names.plural,
      item
    );

    promise
      .then(() => {
        setLoading(false);
        message.success('Resource created');
        props.setShowCreate(false);
      })
      .catch((error) => {
        console.log(error);
        setLoading(false);
        message.error('Could not create the resource');
      });
  }

  const onChange = value => {
    setValue(value);
  }

  const inputText = () => {
    return(
      <div>
        <AceEditor
          mode="yaml"
          theme="monokai"
          fontSize={16}
          value={value}
          showPrintMargin={true}
          showGutter={true}
          onChange={onChange}
          highlightActiveLine={true}
          showLineNumbers={true}
          tabSize={2}
          width={editorWidth}
          height="75vh"
        />
        <div style={{marginTop: 20}}>
          <Button onClick={onClick} style={{width: "20%"}}>OK</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      { !loading ? (
        <Tabs defaultActiveKey="2">
          <Tabs.TabPane tab="JSON/YAML" key="1">
            {inputText()}
          </Tabs.TabPane>
          { props.CRD.spec.validation && props.CRD.spec.validation.openAPIV3Schema ? (
            <Tabs.TabPane tab="Form Wizard" key="2">
              <FormGenerator CRD={props.CRD} submit={submit}/>
            </Tabs.TabPane>
          ) : null}
        </Tabs>
      ) : null }
      { loading ? <LoadingIndicator /> : null }
    </div>
  );
}

export default NewCR;
