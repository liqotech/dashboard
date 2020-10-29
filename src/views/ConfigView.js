import React, { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Layout, message, Space, Tabs, Typography } from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import Utils from '../services/Utils';
import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';
import { widgets } from '../editors/OAPIV3FormGenerator/CustomWidget';
import CustomFieldTemplate from '../editors/OAPIV3FormGenerator/CustomFieldTemplate';
import { fields } from '../editors/OAPIV3FormGenerator/CustomField';
import LoadingIndicator from '../common/LoadingIndicator';
import { splitCamelCaseAndUp } from '../services/stringUtils';

const Form = withTheme(AntDTheme);

function ConfigView() {
  const [loading, setLoading] = useState(true);
  const [CRD] = useState(window.api.getCRDFromKind('ClusterConfig'));
  const [prevConfig, setPrevConfig] = useState();
  const currentConfig = useRef('');
  const util = Utils();

  useEffect(() => {
    if(CRD){
      window.api.getCustomResourcesAllNamespaces(CRD).then( res => {
        setPrevConfig(res.body.items[0]);
        setLoading(false);
        currentConfig.current = Object.keys(res.body.items[0].spec)[0];
      }).catch(error => {
        console.log(error);
        setLoading(false);
      })
    } else {
      setLoading(false);
    }
  }, [])


  const onSubmit = value => {
    let item = { spec: {} };

    if(currentConfig.current){
      item.spec[currentConfig.current] = value.formData;
    }

    let promise = window.api.updateCustomResource(
      CRD.spec.group,
      CRD.spec.version,
      CRD.metadata.namespace,
      CRD.spec.names.plural,
      prevConfig.metadata.name,
      item
    );

    promise
      .then((res) => {
        setPrevConfig(res.body);
        message.success('Configuration updated');
      })
      .catch((error) => {
        console.log(error)
        message.error('Could not update the configuration');
      });
  }

  const configs = [];

  if(prevConfig && CRD){
    const schema = util.OAPIV3toJSONSchema(CRD.spec.validation.openAPIV3Schema).properties.spec.properties;
    Object.keys(CRD.spec.validation.openAPIV3Schema.properties.spec.properties).forEach(config => {
      const sub_schema = schema[config];
      configs.push(
        <Tabs.TabPane tab={
          <span>
            <ToolOutlined />
            {splitCamelCaseAndUp(config)}
          </span>
        } key={config}>
          <div style={{paddingLeft: 10}}>
            <Form
              fields={fields}
              formData={prevConfig.spec[config]}
              schema={sub_schema}
              FieldTemplate={CustomFieldTemplate}
              widgets={widgets}
              onSubmit={onSubmit}
            >
              <Button type="primary" htmlType={'submit'} style={{marginTop: 10}}>Save configuration</Button>
            </Form>
          </div>
        </Tabs.TabPane>
      )
    })
  }

  return(
    <div className="crds-container" style={{maxWidth: '60%'}}>
      <div className={'crd-content'}>
        <Layout style={{background: '#fff'}}>
          <Space align="center">
            <Badge color='#1890FF' />
            <Typography.Title level={2} style={{marginTop: 15}}>
              Liqo configuration
            </Typography.Title>
          </Space>
          <Typography.Text type="secondary" style={{marginBottom: 20, marginLeft: 25}}>
            Choose the best configuration for your system
          </Typography.Text>
        </Layout>
        <Layout style={{background: '#fff'}}>
          <Layout.Content>
            { !loading ? (
              CRD ? (
                prevConfig ? (
                  <Tabs onChange={(key) => {currentConfig.current = key}}>
                    {configs}
                  </Tabs>
                ) : (
                  <Alert
                    message="Error"
                    description="No configuration file has been found."
                    type="error"
                    showIcon
                  />)
              ) : (
                <Alert
                  message="Error"
                  description="No configuration CRD has been found."
                  type="error"
                  showIcon
                />)
            ) : <LoadingIndicator/>}
          </Layout.Content>
        </Layout>
      </div>
    </div>
  );
}

export default ConfigView;
