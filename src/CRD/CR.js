import React, { Component } from 'react';
import './CR.css';
import { Breadcrumb, Button, Card, Menu, notification, Popconfirm, Popover } from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/lib/icons/ExclamationCircleOutlined';
import { Link } from 'react-router-dom';
import EditOutlined from '@ant-design/icons/lib/icons/EditOutlined';
import { APP_NAME } from '../constants';
import PieChart from '../templates/piechart/PieChart';
import HistoChart from '../templates/histogram/HistoChart';
import JsonToTable from '../editors/JsonToTable/JsonToTable';
import ErrorBoundary from '../error-handles/ErrorBoundary';
import UpOutlined from '@ant-design/icons/lib/icons/UpOutlined';

class CR extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showJSON: false,
      deleted: false,
      showStatus: true,
      showSpec: false
    }
    this.handleClick_show = this.handleClick_show.bind(this);
    this.handleClick_delete = this.handleClick_delete.bind(this);
    this.abortWatchers = this.abortWatchers.bind(this);
    this.getChart = this.getChart.bind(this);
    this.handleClick_Spec = this.handleClick_Spec.bind(this);
    this.handleClick_Status = this.handleClick_Status.bind(this);
  }

  abortWatchers() {
    this.props.api.abortAllWatchers(true);
  }

  handleClick_show() {
    if (!this.state.showJSON) {
      this.setState({showJSON: true});
    } else {
      this.setState({showJSON: false});
    }
  }

  handleClick_delete(){
    this.props.api.abortAllWatchers(false, this.props.crd.spec.names.plural);

    let promise = this.props.api.deleteCustomResource(
      this.props.crd.spec.group,
      this.props.crd.spec.version,
      this.props.cr.metadata.namespace,
      this.props.crd.spec.names.plural,
      this.props.cr.metadata.name);

    promise
      .then(() => {
        this.setState({
          deleted: true
        });

        notification.success({
          message: APP_NAME,
          description: 'Resource deleted'
        });

        this.props.func(this.props.cr);
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          deleted: false
        });

        notification.error({
          message: APP_NAME,
          description: 'Could not delete the resource'
        });
      });
  }

  handleClick_Spec(){
    this.setState({showSpec: !this.state.showSpec});
  }

  handleClick_Status(){
    this.setState({showStatus: !this.state.showStatus});
  }

  getChart() {
    return(
      <div className="rep-container">
        {
          this.props.template.kind === 'PieChart' ? (
            <div>
              <PieChart
                CR={this.props.cr.spec}
                template={this.props.template}
              />
            </div>
          ) : null
        }
        {
          this.props.template.kind === 'HistoChart' ? (
            <div>
              <HistoChart
                CR={this.props.cr.spec}
                template={this.props.template}
              />
            </div>
          ) : null
        }
      </div>
    )
  }

  render() {

    let CRdefault = [];
    CRdefault.push(
      <JsonToTable json={this.props.cr.spec} />
    );

    console.log(this.props.cr);

    return(
      <div className="crd-choices">
        { !this.state.deleted ? (
          <Card title={
              <Breadcrumb separator={'>'}>
                <Breadcrumb.Item>{this.props.cr.metadata.name}</Breadcrumb.Item>
              </Breadcrumb>
            }
            extra={
              <div>
                <Link to={{
                  pathname: '/customresources/' + this.props.crd.metadata.name + '/' + this.props.cr.metadata.name + '/update',
                  state: {
                    CR: this.props.cr,
                    group: this.props.crd.spec.group,
                    version: this.props.crd.spec.version,
                    plural: this.props.crd.spec.names.plural
                  }
                }} onClick={this.abortWatchers}>
                  <Popover content={'Edit resource'}>
                    <EditOutlined style={{ fontSize: '20px', marginRight: 15 }} />
                  </Popover>
                </Link>
                <Button onClick={this.handleClick_show} style={{marginRight: 15}}>JSON</Button>
                <Popconfirm
                  placement="topRight"
                  title="Are you sure?"
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                  onConfirm={this.handleClick_delete}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="primary" danger>Delete</Button>
                </Popconfirm>
              </div>
            }
          >
            {
              this.state.showJSON ? (
                <pre>{JSON.stringify(this.props.cr.spec, null, 2)}</pre>
              ) : null
            }
            {
              !this.state.showJSON && this.props.template ? (
                this.getChart()
              ) : null
            }
            {
              !this.state.showJSON && !this.props.template ? (
                <ErrorBoundary>
                  {
                    this.props.cr.status ? (
                      <div onClick={this.handleClick_Status}>
                      <div>
                        <UpOutlined style={{marginRight: 10, marginBottom: 20}}
                                    onClick={this.handleClick_Status}
                                    rotate={this.state.showStatus ? 180 : 0}/>
                        <a onClick={this.handleClick_Status}>Status</a>
                      </div>
                      {
                        this.state.showStatus ? (
                          <JsonToTable json={this.props.cr.status} />
                        ) : null
                      }
                    </div>
                    ) : null
                  }
                  {
                    this.props.cr.spec ? (
                      <div onClick={this.handleClick_Spec}>
                        <div>
                          <UpOutlined style={{marginRight: 10, marginBottom: 20, marginTop: 25}}
                                      onClick={this.handleClick_Spec}
                                      rotate={this.state.showSpec ? 180 : 0}/>
                          <a onClick={this.handleClick_Spec}>Spec</a>
                        </div>
                        {
                          this.state.showSpec ? (
                            <JsonToTable json={this.props.cr.spec} />
                          ) : null
                        }
                      </div>
                    ) : null
                  }
                </ErrorBoundary>
              ) : null
            }
          </Card>
        ) : null}
      </div>
    );
  }


}

export default CR;
