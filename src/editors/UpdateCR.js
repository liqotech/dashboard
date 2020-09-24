import React, { useState } from 'react';
import './UpdateCR.css';
import { Tabs, Button, message, Alert } from 'antd';
import AceEditor from 'react-ace';
import YAML from 'yaml';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/theme-monokai';
import LoadingIndicator from '../common/LoadingIndicator';
import FormGenerator from './OAPIV3FormGenerator/FormGenerator';

function UpdateCR(props) {
  const [value, setValue] = useState(JSON.stringify(props.CR.spec, null, 2));
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

    submit(item);
  }

  const submit = item => {
    item = {
      spec: item
    }

    setLoading(true);

    let promise = window.api.updateCustomResource(
      props.group,
      props.version,
      props.CR.metadata.namespace,
      props.plural,
      props.CR.metadata.name,
      item
    );

    promise
      .then(() => {
        setLoading(false);
        props.setShowUpdate(false);
        message.success('Resource updated');
      })
      .catch(() => {
        setLoading(false);
        message.error('Could not update the resource');
      });
  }

  const onChange = (value) => {
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
          onChange={onChange}
          tabSize={2}
          height={'75vh'}
          width={editorWidth}
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
              <Alert.ErrorBoundary>
                <FormGenerator CRD={props.CRD} submit={submit} CR={props.CR} onUpdate={true}/>
              </Alert.ErrorBoundary>
            </Tabs.TabPane>
          ) : null}
        </Tabs>
      ) : null }
      { loading ? <LoadingIndicator /> : null }
    </div>
  );
}

export default UpdateCR;
