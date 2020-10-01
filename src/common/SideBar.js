import React, { useEffect, useState } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import DesktopOutlined from '@ant-design/icons/lib/icons/DesktopOutlined';
import './SideBar.css';
import DashboardOutlined from '@ant-design/icons/lib/icons/DashboardOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import LayoutOutlined from '@ant-design/icons/lib/icons/LayoutOutlined';
import StarOutlined from '@ant-design/icons/lib/icons/StarOutlined';
import AddCustomView from '../views/AddCustomView';

const Sider = Layout.Sider;

function SideBar() {

  const [CV, setCV] = useState([]);
  const [favourites, setFavourites] = useState(window.api.CRDs.current.filter(item => {
    return item.metadata.annotations && item.metadata.annotations.favourite;
  }))
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    window.api.CVArrayCallback.current.push(getCustomViews);
    window.api.sidebarCallback.current = getFavourite;
  }, [])

  const getFavourite = CRDs => {
    setFavourites(CRDs);
  }

  const getCustomViews = () => {
    setCV([...window.api.customViews.current]);
  }

  const onCollapse = collapsed => {
    setCollapsed(collapsed);
  }

  let cv = [];
  let fav = [];

  /** If there are custom views, show them in the sider */
  if(CV.length !== 0) {
    CV.forEach(item => {
      cv.push(
        <Menu.Item key={item.metadata.name} style={{ marginTop: 8}}>
          <Link to={{
            pathname: '/customview/' +  item.metadata.name,
          }}>
            <LayoutOutlined style={{ fontSize: '20px' }} />
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
    });
  }

  /** If there are favourite CRDs, show them in the sider */
  if(favourites.length !== 0) {
    favourites.forEach(item => {
      fav.push(
        <Menu.Item key={item.metadata.name} style={{ marginTop: 8}}>
          <Link to={{
            pathname: '/customresources/' +  item.metadata.name}}
          >
            <span>{item.spec.names.kind}</span>
          </Link>
        </Menu.Item>
      )
    });
  }

  return (
    <div>
      <Sider className="sidebar" width={250}
             theme={'light'}
             collapsible collapsed={collapsed}
             onCollapse={onCollapse}
             breakpoint="lg"
      >
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
        <Menu mode="inline" defaultOpenKeys={['sub_fav']}
              defaultSelectedKeys={'1'} style={{ marginTop: 16}}>
          <Menu.Item key="1">
            <Link to="/">
              <DashboardOutlined style={{ fontSize: '20px' }} />
              <span>Home</span>
            </Link>
          </Menu.Item>
          <Menu.Divider/>
          {cv}
          <Menu.Item key="addCV" style={{ marginTop: 8}}>
            <AddCustomView  />
          </Menu.Item>
          <Menu.Divider/>
          <Menu.Item key="2" style={{ marginTop: 8}}>
            <Link to="/customresources">
              <DesktopOutlined style={{ fontSize: '20px' }} />
              <span>Custom Resources</span>
            </Link>
          </Menu.Item>
          <Menu.SubMenu key={"sub_fav"}
                        icon={<StarOutlined style={{ fontSize: '20px' }} />}
                        title={'Favourites'}
          >
            {fav}
          </Menu.SubMenu>
          <Menu.Divider/>
          <Menu.Item key="3" style={{ marginTop: 8}}>
            <Link to="/settings">
              <SettingOutlined style={{ fontSize: '20px' }} />
              <span>Settings</span>
            </Link>
          </Menu.Item>
        </Menu>
      </Sider>
    </div>
  );
}

export default withRouter(SideBar);
