import React, { Component } from 'react';
import './CR.css';
import {
  Badge, Card,
  Button,
  Drawer,
  notification,
  Popconfirm, Alert,
  Tooltip, Typography, Collapse

} from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/lib/icons/ExclamationCircleOutlined';
import EditOutlined from '@ant-design/icons/lib/icons/EditOutlined';
import { APP_NAME } from '../constants';
import PieChart from '../templates/piechart/PieChart';
import HistoChart from '../templates/histogram/HistoChart';
import DeleteOutlined from '@ant-design/icons/lib/icons/DeleteOutlined';
import UpdateCR from '../editors/UpdateCR';
import { withRouter } from 'react-router-dom';
import FormViewer from '../editors/OAPIV3FormGenerator/FormViewer';
import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';

class CR extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showJSON: false,
      deleted: false,
      showStatus: false,
      showSpec: false,
      showUpdate: false,
      currentTab: 'Spec'
    };
    this.handleClick_show = this.handleClick_show.bind(this);
    this.handleClick_delete = this.handleClick_delete.bind(this);
    this.getChart = this.getChart.bind(this);
    this.onTabChange = this.onTabChange.bind(this);
  }

  onTabChange = (key) => {
    this.setState({ currentTab: key });
  };

  /** Make the JSON visible or invisible */
  handleClick_show(event) {
    event.stopPropagation();
    this.setState({showJSON: !this.state.showJSON});
  }

  /** Delete the CR */
  handleClick_delete() {
    let promise = window.api.deleteCustomResource(
      this.props.crd.spec.group,
      this.props.crd.spec.version,
      this.props.cr.metadata.namespace,
      this.props.crd.spec.names.plural,
      this.props.cr.metadata.name
    );

    promise
      .then(() => {
        this.setState({
          deleted: true
        });

        notification.success({
          message: APP_NAME,
          description: 'Resource deleted'
        });
      })
      .catch((error) => {
        console.log(error);
        if(error.response._fetchResponse.status)
          this.props.history.push("/error/" + error.response._fetchResponse.status);

        notification.error({
          message: APP_NAME,
          description: 'Could not delete the resource'
        });
      });
  }

  /** If the CRD has a template, show it as the first option */
  getChart() {
    return (
      <div className="rep-container">
        {this.props.template.kind === 'PieChart' ? (
          <div aria-label={'piechart'}>
            <PieChart CR={this.props.cr.spec} template={this.props.template} />
          </div>
        ) : null}
        {this.props.template.kind === 'HistoChart' ? (
          <div aria-label={'histochart'}>
            <HistoChart
              CR={this.props.cr.spec}
              template={this.props.template}
            />
          </div>
        ) : null}
      </div>
    );
  }

  render() {
    let tabList = [];

    if(this.props.cr.metadata)
      tabList.push({
        key: 'Metadata',
        tab: <span>
               <ToolOutlined />
               Metadata
             </span>
      })

    if(this.props.cr.spec)
      tabList.push({
        key: 'Spec',
        tab: <span>
               <ToolOutlined />
               Spec
             </span>
      })

    if(this.props.cr.status)
      tabList.push({
        key: 'Status',
        tab: <span>
               <ToolOutlined />
               Status
             </span>
      })

    this.contentList = {
      Metadata: this.props.cr.metadata ? (
        <div key={'metadata_' + this.props.cr.metadata.name}>
          <Alert.ErrorBoundary>
            <div aria-label={'form_metadata'}>
              <FormViewer CR={this.props.cr} CRD={this.props.crd}  show={'metadata'} />
            </div>
          </Alert.ErrorBoundary>
        </div>
      ) : null,
      Spec: this.props.cr.spec ? (
        <div key={'spec_' + this.props.cr.metadata.name}>
          <Alert.ErrorBoundary>
            <div aria-label={'form_spec'}>
              <FormViewer CR={this.props.cr} CRD={this.props.crd}  show={'spec'} />
            </div>
          </Alert.ErrorBoundary>
        </div>
      ) : null,
      Status: this.props.cr.status ? (
        <div key={'status_' + this.props.cr.metadata.name}>
          <Alert.ErrorBoundary>
            <div aria-label={'form_status'}>
              <FormViewer CR={this.props.cr} CRD={this.props.crd} show={'status'}  />
            </div>
          </Alert.ErrorBoundary>
        </div>) : null,
    };

    return (
      !this.state.deleted ? (
        <div aria-label={'cr'} style={{ marginBottom: 10 }}>
          <Collapse className={'crd-collapse'} style={{backgroundColor: '#fafafa'}}>
            <Collapse.Panel
              key={'collapse_' + this.props.cr.metadata.name}
              style={{ borderBottomColor: '#f0f0f0' }}
              header={<Typography.Text strong>{this.props.cr.metadata.name}</Typography.Text>}
              extra={
                <div onClick={(event) => {
                  event.stopPropagation();
                }}>
                  <Tooltip title={'Edit resource'}>
                    <EditOutlined
                      onClick={(event) => {
                        event.stopPropagation();
                        this.setState({showUpdate: true})}
                      }
                      style={{ fontSize: 15, marginRight: 15, color: '#1890FF' }}
                    />
                  </Tooltip>
                  <Drawer
                    title={
                      <Badge status="processing"
                             text={"Update " + this.props.cr.metadata.name}
                      />
                    }
                    placement={'right'}
                    visible={this.state.showUpdate}
                    onClose={() => {this.setState({showUpdate: false})}}
                    width={'40%'}
                  >
                    <UpdateCR CR={this.props.cr} CRD={this.props.crd}
                              group={this.props.crd.spec.group}
                              version={this.props.crd.spec.version}
                              plural={this.props.crd.spec.names.plural}
                              this={this}

                    />
                  </Drawer>
                  <Tooltip title={'Show JSON'}>
                    <Button size={'small'}
                      onClick={(event) => this.handleClick_show(event)}
                      style={ !this.state.showJSON ?
                        { marginRight: 15 } : { marginRight: 15, color: '#1890FF' }}
                    >
                      JSON
                    </Button>
                  </Tooltip>
                  <Tooltip title={'Delete resource'} placement={'topRight'}>
                    <Popconfirm
                      placement="topRight"
                      title="Are you sure?"
                      icon={<ExclamationCircleOutlined style={{ color: 'red' }}/>}
                      onConfirm={this.handleClick_delete}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button size={'small'}
                              type="primary" danger icon={<DeleteOutlined />}
                              onClick={event => {
                                event.stopPropagation();
                              }}
                      />
                    </Popconfirm>
                  </Tooltip>
                </div>
              }
            >
              <div>
                {this.state.showJSON ? (
                  <div>
                    <div aria-label={'json'}>
                      {this.props.cr.spec ? (<pre>{JSON.stringify(this.props.cr.spec, null, 2)}</pre>) : null}
                      {this.props.cr.status ? (<pre>{JSON.stringify(this.props.cr.status, null, 2)}</pre>) : null}
                    </div>
                  </div>
                ) : null}
                {!this.state.showJSON && this.props.template
                  ? this.getChart()
                  : null}
                {!this.state.showJSON && !this.props.template ? (
                  <Card tabList={tabList}
                        tabProps={{
                          size: 'small'
                        }}
                        size={'small'}
                        type={'inner'}
                        activeTabKey={this.state.currentTab}
                        onTabChange={key => {this.onTabChange(key)}}
                  >
                    {this.contentList[this.state.currentTab]}
                  </Card>
                ) : null}
              </div>
            </Collapse.Panel>
          </Collapse>
        </div>
      ) : <div/>
    );
  }
}

export default withRouter(CR);
