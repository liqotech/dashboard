import React, { Component } from 'react';
import { Alert, Badge, Button, Layout, message, notification, Space, Tabs, Typography } from 'antd';
import { withTheme } from '@rjsf/core';
import { Theme as AntDTheme } from '@rjsf/antd';
import Utils from '../services/Utils';
import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';
import { widgets } from '../editors/OAPIV3FormGenerator/CustomWidget';
import { CustomFieldTemplate } from '../editors/OAPIV3FormGenerator/CustomField';
import LoadingIndicator from '../common/LoadingIndicator';
import { splitCamelCaseAndUp } from '../services/stringUtils';
import { APP_NAME } from '../constants';

const Form = withTheme(AntDTheme);

class ConfigView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      CRD: this.props.api.getCRDfromKind('ClusterConfig'),
      prevConfig: null,
      currentConfig: null
    }
    this.util = new Utils();
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    this.props.api.getCustomResourcesAllNamespaces(this.state.CRD).then( res => {
      this.setState({
        prevConfig: res.body.items[0],
        loading: false,
        currentConfig: Object.keys(res.body.items[0].spec)[0]
      })
    }).catch(error => {
      console.log(error);
      this.setState({
        loading: false
      })
    })
  }

  onSubmit(value) {
    let item = { spec: {} };

    if(this.state.currentConfig){
      item.spec[this.state.currentConfig] =  value.formData;
    }

    this.setState({isLoading: true});

    //console.log(this.state.CRD, item, this.state.prevConfig);

    let promise = this.props.api.updateCustomResource(
      this.state.CRD.spec.group,
      this.state.CRD.spec.version,
      this.state.CRD.metadata.namespace,
      this.state.CRD.spec.names.plural,
      this.state.prevConfig.metadata.name,
      item
    );

    promise
      .then((res) => {
        console.log(res);
        this.setState({
          isLoading: false,
          prevConfig: res.body
        });
        notification.success({
          message: APP_NAME,
          description: 'Configuration updated'
        });
      })
      .catch((error) => {
        console.log(error)
        this.setState({
          isLoading: false
        });
        notification.error({
          message: APP_NAME,
          description: 'Could not update the configuration'
        });
      });
  }

  render() {
    const configs = [];

    if(this.state.prevConfig && this.state.CRD){
      const schema = this.util.OAPIV3toJSONSchema(this.state.CRD.spec.validation.openAPIV3Schema).properties.spec.properties;
      this.util.setDefault(schema, this.state.prevConfig.spec);
      Object.keys(this.state.CRD.spec.validation.openAPIV3Schema.properties.spec.properties).forEach(config => {
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
                schema={sub_schema}
                FieldTemplate={CustomFieldTemplate}
                widgets={widgets}
                onSubmit={this.onSubmit}
              >
                <Button type="primary" htmlType={'submit'}>Save configuration</Button>
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
              { !this.state.loading ? (
                  this.state.prevConfig ? (
                      <Tabs onChange={(key) => {this.state.currentConfig = key}}>
                        {configs}
                      </Tabs>
                    ): (
                      <Alert
                        message="Error"
                        description="No configuration file has been found."
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
}

export default ConfigView;
