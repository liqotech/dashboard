import React, { useState } from 'react';
import './UpdateCR.css';
import { Tabs, message, Alert, Badge, Drawer } from 'antd';
import LoadingIndicator from '../../common/LoadingIndicator';
import FormGenerator from '../OAPIV3FormGenerator/FormGenerator';
import Editor from '../Editor';

function UpdateCR(props) {
  const [loading, setLoading] = useState(false);

  const submit = item => {
    item = {
      spec: item
    }

    setLoading(true);

    let promise = window.api.updateCustomResource(
      props.CRD.spec.group,
      props.CRD.spec.version,
      props.CR.metadata.namespace,
      props.CRD.spec.names.plural,
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

  return (
    <Drawer
      title={
        <Badge status="processing"
               text={"Update " + props.CR.metadata.name}
        />
      }
      placement={'right'}
      visible={props.showUpdate}
      onClose={() => {props.setShowUpdate(false)}}
      width={window.innerWidth > 1400 ? 1200 : window.innerWidth - 200}
    >
      { !loading ? (
        <Tabs defaultActiveKey="2">
          <Tabs.TabPane tab="JSON/YAML" key="1">
            <Editor value={JSON.stringify(props.CR.spec, null, 2)}
                    onClick={submit}
            />
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
    </Drawer>
  );
}

export default UpdateCR;
