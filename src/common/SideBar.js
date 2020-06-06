import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Layout, Menu, notification } from 'antd';
import DesktopOutlined from '@ant-design/icons/lib/icons/DesktopOutlined';
import './SideBar.css';
import DashboardOutlined from '@ant-design/icons/lib/icons/DashboardOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import { APP_NAME } from '../constants';
import LayoutOutlined from '@ant-design/icons/lib/icons/LayoutOutlined';
import StarOutlined from '@ant-design/icons/lib/icons/StarOutlined';
const Sider = Layout.Sider;

class SideBar extends Component {
  constructor(props) {
    super(props);
    this.notifyEvent = this.notifyEvent.bind(this);

    this.state = {
      favourites: [],
      customViews: [],
      isLoading: true,
      controller: null
    }
    this.getFavourite = this.getFavourite.bind(this);
    this.loadCustomResources = this.loadCustomResources.bind(this);
    if(this.props.api){
      this.props.api.sidebarCallback = this.getFavourite;
      this.state.favourites = this.props.api.CRDs.filter(item => {
        return item.metadata.annotations && item.metadata.annotations.favourite;
      })
    }
  }

  loadCustomResources() {
    if(this.props.api){
      this.setState({
        isLoading: false
      });
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
                this.notifyEvent)
            });
          }
        ).catch((error) => {
        console.log(error);
        this.props.history.push("/error/" + error.response.statusCode);
      })
    }
  }

  componentDidMount() {
    this.loadCustomResources();
  }

  /** Technically useless */
  componentDidUpdate() {
    if(this.props.api && this.state.isLoading){
      this.loadCustomResources();
    }
  }

  getFavourite(CRDs){
    this.setState({favourites: CRDs});
  }

  notifyEvent(type, object) {

    let customViews = this.state.customViews;

    let index = customViews.indexOf(customViews.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(index !== -1) {
        if(object.metadata.resourceVersion !== customViews[index].metadata.resourceVersion){
          customViews[index] = object;
          notification.success({
            message: APP_NAME,
            description: 'CRD ' + object.metadata.name + ' modified'
          });
          this.setState({
            customViews: customViews
          });
        }
      } else {
        customViews.push(object);
        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' added'
        });
        this.setState({
          customViews: customViews
        });
      }
    } else if (type === 'DELETED') {
      if(index !== -1) {
        customViews.splice(index, 1);
        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' deleted'
        });
        this.setState({
          customViews: customViews
        });
      } else {
        return;
      }
    }
  }

  render() {
    let cv = [];
    let fav = [];

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
                {
                  item.spec.name ? (
                    <span>{ item.spec.name }</span>
                  ) : (
                    <span>{ item.metadata.name }</span>
                  )
                }
              </Link>
            </Menu.Item>
          )
        });
      }
    }

    if (!this.state.isLoading) {
      /** If there are favourite CRDs, show them in the sider */
      if(this.state.favourites.length !== 0) {
        this.state.favourites.forEach(item => {
          fav.push(
            <Menu.Item key={item.metadata.name}>
              <Link to={{
                pathname: '/customresources/' +  item.metadata.name}}
              >
                <StarOutlined style={{ fontSize: '20px' }} />
                {item.spec.names.kind}
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
          {fav}
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
