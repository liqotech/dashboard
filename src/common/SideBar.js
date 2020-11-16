import React, { useEffect, useState } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import './SideBar.css';
import _ from 'lodash';
import {
  DashboardOutlined, SettingOutlined,
  LayoutOutlined, StarOutlined, ApiOutlined, BlockOutlined
} from '@ant-design/icons';
import AddCustomView from '../views/AddCustomView';
import CustomIcon from '../resources/common/CustomIcon';

const Sider = Layout.Sider;

function SideBar() {

  const [CV, setCV] = useState([]);
  const [favouritesResource, setFavouriteResource] = useState([]);
  const [favouritesCRD, setFavouritesCRD] = useState(window.api.CRDs.current.filter(item => {
    return item.metadata.annotations && item.metadata.annotations.favourite;
  }))
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    window.api.CVArrayCallback.current.push(getCustomViews);
    window.api.DCArrayCallback.current.push(getFavouriteResources);
    window.api.sidebarCallback.current = getFavourite;
  }, [])

  const getFavourite = CRDs => {
    setFavouritesCRD(CRDs);
  }

  const getFavouriteResources = () => {
    setFavouriteResource(window.api.dashConfigs.current.spec.resources.filter(resource => {
      return resource.favourite;
    }));
  }

  const getCustomViews = () => {
    setCV([...window.api.customViews.current]);
  }

  const onCollapse = collapsed => {
    setCollapsed(collapsed);
  }

  let cv = [];
  let fav = [];
  let favR = [];

  /** If there are custom views, show them in the sider */
  if(CV.length !== 0) {
    CV.forEach(item => {
      if(item.spec.enabled){
        cv.push(
          <Menu.Item key={item.metadata.name} style={{ marginTop: 0, marginBottom: 0}}
                     icon={<CustomIcon icon={item.spec.icon ? item.spec.icon : 'LayoutOutlined'} size={20} />}
          >
            <Link to={{
              pathname: '/customview/' +  item.metadata.name,
            }}>
              {
                item.spec.viewName ? (
                  <span>{ item.spec.viewName }</span>
                ) : (
                  <span>{ item.metadata.name }</span>
                )
              }
            </Link>
          </Menu.Item>
        )
      }
    });
  }

  /** If there are favourite CRDs, show them in the sider */
  if(favouritesCRD.length !== 0) {
    favouritesCRD.forEach(item => {
      fav.push(
        <Menu.Item key={item.metadata.name}
                   icon={<StarOutlined style={{ fontSize: '20px' }} />}
        >
          <Link to={{
            pathname: '/customresources/' +  item.metadata.name}}
          >
            <span>{item.spec.names.kind}</span>
          </Link>
        </Menu.Item>
      )
    });
  }

  /** If there are favourite Resources, show them in the sider */
  if(favouritesResource.length !== 0) {
    favouritesResource.forEach(item => {
      favR.push(
        <Menu.Item key={item.resourceName}
                   icon={<CustomIcon icon={item.icon} size={20} />}
        >
          <Link to={{
            pathname: item.resourcePath}}
          >
            <span>{item.resourceName}</span>
          </Link>
        </Menu.Item>
      )
    });
  }

  let width = 250;

  if( _.isEmpty(window.api.dashConfigs.current) ||
    !window.api.dashConfigs.current.spec.sidebar ||
    !window.api.dashConfigs.current.spec.sidebar.enabled
  )
    width = 0;

  return (
    <div>
      <Sider className="sidebar" width={width}
             collapsible collapsed={collapsed}
             onCollapse={width === 0 ? null : onCollapse}
             breakpoint="lg"
      >
        {width !== 0 ? (
          <>
          <div className="app-title" align="middle">
            <img src={require('../assets/logo_4.png')}
                 className="image" alt="image"
                 style={collapsed ? {marginLeft: 22} : null}
            />
            {!collapsed ? (
              <Link to="/">
                <img src={require('../assets/name.png')}
                     alt="image"
                     style={{height: 30, width: 120}}
                />
              </Link>
            ) : null}
          </div>
          <Menu mode="inline" defaultOpenKeys={['sub_fav', 'resources', 'APIs', 'customViews']}
                defaultSelectedKeys={'1'} style={{ marginTop: 16, borderRight: '0px solid'}}>
            <Menu.Item key="home" style={{ marginBottom: 0}}
                       icon={<DashboardOutlined style={{ fontSize: '20px' }} />}
            >
              <Link to="/">
                <span>Home</span>
              </Link>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.SubMenu key={"customViews"}
                          title={
                            collapsed ? <LayoutOutlined style={{ fontSize: '20px', marginLeft: 16 }} />:
                              <Typography.Text type={'secondary'}>Custom Views</Typography.Text>
                          }
            >
              {cv}
              <Menu.Item key="addCV" style={{ marginTop: 0, marginBottom: 0}}>
                <AddCustomView  />
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.Divider/>
            <Menu.SubMenu key={"APIs"}
                          title={
                            collapsed ? <ApiOutlined style={{ fontSize: '20px', marginLeft: 16 }} />:
                              <Typography.Text type={'secondary'}>APIs</Typography.Text>
                          }
            >
              <Menu.Item key="apis"
                         icon={<ApiOutlined style={{ fontSize: '20px' }} />}
              >
                <Link to="/apis">
                  <span>Apis</span>
                </Link>
              </Menu.Item>
              <Menu.Item key="api"
                         icon={<ApiOutlined style={{ fontSize: '20px' }} />}
              >
                <Link to="/api/v1">
                  <span>Api V1</span>
                </Link>
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.Divider/>
            <Menu.SubMenu key={"resources"}
                          title={
                            collapsed ? <BlockOutlined style={{ fontSize: '20px', marginLeft: 16 }} />:
                              <Typography.Text type={'secondary'}>Resources</Typography.Text>
                          }
            >
              {favR}
            </Menu.SubMenu>
            <Menu.Divider/>
            <Menu.SubMenu key={"sub_fav"}
                        title={
                          collapsed ? <StarOutlined style={{ fontSize: '20px', marginLeft: 16 }} />:
                          <Typography.Text type={'secondary'}>Favourites</Typography.Text>
                        }
          >
            {fav}
          </Menu.SubMenu>
          <Menu.Divider/>
            <Menu.Item key="settings" style={{ marginTop: 0, marginBottom: 0}}
                       icon={<SettingOutlined style={{ fontSize: '20px' }} />}
            >
              <Link to="/settings">
                <span>Settings</span>
              </Link>
            </Menu.Item>
          </Menu>
          </>
        ) : null}
      </Sider>
    </div>
  );
}

export default withRouter(SideBar);
