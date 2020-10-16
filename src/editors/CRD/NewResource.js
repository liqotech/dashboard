import React from 'react';
import { Tabs, message, Badge, Drawer } from 'antd';
import FormGenerator from '../OAPIV3FormGenerator/FormGenerator';
import Editor from '../Editor';

function NewResource(props) {

  const onClick = item => {

    if(!item || !item.metadata || item.metadata.name === ''){
      message.error('Errors in the custom resource definition');
      return;
    }

    submit(item);
  }

  const submit = item => {
    let promise;
    let namespace;

    if(item.metadata.namespace) {
      namespace = item.metadata.namespace;
    }

    if(props.resource){
      /** A new cr from a crd */

      if (props.resource.spec.scope === 'Namespaced' && !namespace) {
        namespace = 'default';
      }

      promise = window.api.createCustomResource(
        props.resource.spec.group,
        props.resource.spec.version,
        namespace,
        props.resource.spec.names.plural,
        item
      );
    } else {
      /** A new general resource */
      promise = props.addFunction(item);
    }

    promise
      .then(() => {
        props.setShowCreate(false);
      })
      .catch(() => {
        message.error('Could not create the resource');
      });
  }

  return (
    <Drawer
      title={
        <Badge status="processing"
               text={"Create a new " + props.kind + " resource"}
        />
      }
      placement={'right'}
      visible={props.showCreate}
      onClose={() => {props.setShowCreate(false)}}
      width={window.innerWidth > 1400 ? 1200 : window.innerWidth - 200}
      destroyOnClose
    >
      <Tabs defaultActiveKey="2">
        <Tabs.TabPane tab="JSON/YAML" key="1">
          <Editor onClick={onClick} placeholder={'Create a new ' + props.kind} />
        </Tabs.TabPane>
        { props.resource && props.resource.spec.validation && props.resource.spec.validation.openAPIV3Schema ? (
          <Tabs.TabPane tab="Form Wizard" key="2">
            <FormGenerator CRD={props.resource} submit={submit}/>
          </Tabs.TabPane>
        ) : null}
      </Tabs>
    </Drawer>
  );
}

export default NewResource;
