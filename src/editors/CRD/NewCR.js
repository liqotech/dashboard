import React, { useState } from 'react';
import './NewCR.css';
import { Tabs, message, Badge, Drawer } from 'antd';
import LoadingIndicator from '../../common/LoadingIndicator';
import FormGenerator from '../OAPIV3FormGenerator/FormGenerator';
import Editor from '../Editor';

function NewCR(props) {

  const [loading, setLoading] = useState(false);

  const onClick = (item) => {

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

  return (
    <Drawer
      title={
        <Badge status="processing"
               text={"Create a new " + props.CRD.spec.names.kind + " resource"}
        />
      }
      placement={'right'}
      visible={props.showCreate}
      onClose={() => {props.setShowCreate(false)}}
      width={window.innerWidth > 1400 ? 1200 : window.innerWidth - 200}
      destroyOnClose
    >
      { !loading ? (
        <Tabs defaultActiveKey="2">
          <Tabs.TabPane tab="JSON/YAML" key="1">
            <Editor value={''}
                    onClick={onClick}
            />
          </Tabs.TabPane>
          { props.CRD.spec.validation && props.CRD.spec.validation.openAPIV3Schema ? (
            <Tabs.TabPane tab="Form Wizard" key="2">
              <FormGenerator CRD={props.CRD} submit={submit}/>
            </Tabs.TabPane>
          ) : null}
        </Tabs>
      ) : null }
      { loading ? <LoadingIndicator /> : null }
    </Drawer>
  );
}

export default NewCR;
