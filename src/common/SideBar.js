import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Layout, Menu, notification } from 'antd';
import DesktopOutlined from '@ant-design/icons/lib/icons/DesktopOutlined';
import './SideBar.css';
import DashboardOutlined from '@ant-design/icons/lib/icons/DashboardOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import { APP_NAME } from '../constants';
import LayoutOutlined from '@ant-design/icons/lib/icons/LayoutOutlined';
const Sider = Layout.Sider;

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.notifyEvent = this.notifyEvent.bind(this);

    this.state = {
      customViews: [],
      isLoading: true
    }

    this.loadCustomResources = this.loadCustomResources.bind(this);
  }

  loadCustomResources() {
    if(this.props.api){
      let CRD = {
        spec: {
          group: 'crd-template.liqo.com',
          version: 'v1',
          names: {
            plural: 'views'
          }
        }
      }
      /** First get all the CR */
      this.props.api.getCustomResourcesAllNamespaces(CRD)
        .then((res) => {
            this.setState({
              customViews: res.body.items
            });

            /** Then set up a watch to watch changes in the CR of the CRD */
            this.setState({
              controller: this.props.api.watchSingleCRD(
                CRD.spec.group,
                CRD.spec.version,
                CRD.spec.names.plural,
                this.notifyEvent),
              isLoading: false
            });
          }
        ).catch((error) => {
        console.log(error);
      })
    }
  }

  componentDidMount() {
    this.loadCustomResources();
  }

  notifyEvent(type, object) {

    let customViews = this.state.customViews;

    let index = customViews.indexOf(customViews.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(index !== -1) {
        customViews[index] = object;
      } else {
        customViews.push(object);

        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' added'
        });
      }
    } else if (type === 'DELETED') {
      if(index !== -1) {
        customViews.splice(index, 1);

        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' deleted'
        });
      } else {
        return;
      }
    }

    this.setState({
      customViews: customViews
    });
  }

  render() {
    let cv = [];

    if (!this.state.isLoading) {
      /** If there are custom views, show them in the sider */
      if(this.state.customViews.length !== 0) {
        this.state.customViews.forEach(item => {
          cv.push(
            <Menu.Item key={item.metadata.name}>
              <Link to={{
                pathname: '/customview/' +  item.metadata.name,
                state: {
                  view: item
                }}}>
                <LayoutOutlined style={{ fontSize: '20px' }} />
                <span>{item.metadata.name}</span>
              </Link>
            </Menu.Item>
          )
        });
      }
    }

    return (
      <Sider className="sidebar" width={250}>
        <div className="logo" />
        <Menu mode="inline">
          <Menu.Item key="1">
            <Link to="/">
              <DashboardOutlined style={{ fontSize: '20px' }} />
              <span>Home Page</span>
            </Link>
          </Menu.Item>
          {cv}
          <Menu.Item key="2">
            <Link to="/customresources">
              <DesktopOutlined style={{ fontSize: '20px' }} />
              <span>Custom Resources</span>
            </Link>
          </Menu.Item>
          <Menu.Item key="9">
            <SettingOutlined style={{ fontSize: '20px' }} />
            <span>Settings</span>
          </Menu.Item>
        </Menu>
      </Sider>
    );
  }
}

export default withRouter(SideBar);
