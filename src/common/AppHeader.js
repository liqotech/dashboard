import React, { useEffect, useState } from 'react';
import { withRouter, useHistory, Link } from 'react-router-dom';
import './AppHeader.css';
import {
  Switch,
  Modal,
  Col,
  Layout,
  Menu,
  Row,
  Typography,
  Tooltip,
  Dropdown
} from 'antd';
import {
  EllipsisOutlined,
  GithubOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
import NamespaceSelect from './NamespaceSelect';
import { ResourceAutocomplete } from './ResourceAutocomplete';
import _ from 'lodash';
import CustomIcon from '../resources/common/CustomIcon';
import Utils from '../services/Utils';
const Header = Layout.Header;
import dark from '../themes/dark.json';
import light from '../themes/light.json';
import ThemeModifier from '../themes/ThemeModifier';
import { resizeDetector } from '../customView/CustomViewUtils';

function AppHeader(props) {
  const [isDarkMode, setIsDarkMode] = React.useState(
    localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme')
  );
  const [infoModal, setInfoModal] = useState(false);
  const [breakpoint, setBreakpoint] = useState('lg');
  const [, setConfig] = useState(window.api.dashConfigs.current);
  let history = useHistory();
  let menuItems;
  let namespaceSelector;

  const toggleTheme = isChecked => {
    setIsDarkMode(isChecked);
    if (isChecked)
      window.less
        .modifyVars(dark)
        .then(() => localStorage.setItem('theme', 'dark'));
    else
      window.less
        .modifyVars(light)
        .then(() => localStorage.setItem('theme', 'light'));
  };

  useEffect(() => {
    window.api.DCArrayCallback.current.push(() =>
      setConfig(window.api.dashConfigs.current)
    );
  }, []);

  menuItems = [];

  if (Utils().parseJWT())
    menuItems.push(
      <Menu.Item
        key="welcome"
        style={breakpoint !== 'lg' ? { padding: 20 } : { margin: 0 }}
      >
        <Typography.Text
          strong
          style={{
            fontStyle: 'italic',
            fontSize: 18,
            marginLeft: 20,
            marginRight: 20
          }}
        >
          {'Welcome back' +
            (Utils().parseJWT().given_name
              ? ' ' + Utils().parseJWT().given_name
              : '') +
            '!'}
        </Typography.Text>
      </Menu.Item>
    );

  if (!_.isEmpty(window.api.dashConfigs.current)) {
    if (
      window.api.dashConfigs.current.spec.header &&
      window.api.dashConfigs.current.spec.header.namespaceSelector
    ) {
      namespaceSelector = (
        <Menu.Item key="namespace" style={{ margin: 0 }}>
          <NamespaceSelect />
        </Menu.Item>
      );

      if (breakpoint === 'lg') menuItems.push(namespaceSelector);
    }

    if (
      window.api.dashConfigs.current.spec.header &&
      window.api.dashConfigs.current.spec.header.menu &&
      window.api.dashConfigs.current.spec.header.menu.length !== 0
    ) {
      window.api.dashConfigs.current.spec.header.menu.forEach(item => {
        if (item.enabled) {
          menuItems.push(
            <Menu.Item
              key={item.link + item.itemDescription + item.icon}
              style={{ margin: 0 }}
              onClick={() => {
                if (item.link.includes('http'))
                  window.open(item.link, '_blank');
                else history.push(item.link);
              }}
            >
              {item.link ? (
                <Tooltip
                  title={breakpoint !== 'lg' ? '' : item.itemDescription}
                >
                  <CustomIcon
                    icon={item.icon ? item.icon : 'LayoutOutlined'}
                    style={
                      breakpoint !== 'lg'
                        ? { padding: 6, fontSize: 20 }
                        : { padding: 20, fontSize: 20 }
                    }
                  />
                  {breakpoint !== 'lg' ? (
                    <span>{item.itemDescription}</span>
                  ) : null}
                </Tooltip>
              ) : (
                <div>{item.itemDescription}</div>
              )}
            </Menu.Item>
          );
        }
      });
    }
  }

  if (
    !_.isEmpty(window.api.dashConfigs.current) &&
    window.api.dashConfigs.current.spec.header &&
    window.api.dashConfigs.current.spec.header.themeModifier
  ) {
    menuItems.push(
      <Menu.Item
        key="theme_mod"
        style={
          breakpoint !== 'lg' ? { padding: 10, paddingLeft: 0 } : { margin: 0 }
        }
      >
        <ThemeModifier showDescription={breakpoint !== 'lg'} />
      </Menu.Item>
    );
  }

  if (
    !_.isEmpty(window.api.dashConfigs.current) &&
    window.api.dashConfigs.current.spec.header &&
    window.api.dashConfigs.current.spec.header.themeSwitcher
  ) {
    menuItems.push(
      <Menu.Item
        key="theme"
        style={
          breakpoint !== 'lg' ? { padding: 10, paddingLeft: 14 } : { margin: 0 }
        }
      >
        <Tooltip title={breakpoint !== 'lg' ? '' : 'Switch theme'}>
          <Switch
            checked={isDarkMode}
            style={
              breakpoint !== 'lg'
                ? {}
                : { marginLeft: 20, marginRight: 20, marginTop: -5 }
            }
            onChange={toggleTheme}
            size={'small'}
          />
          {breakpoint !== 'lg' ? (
            <span style={{ paddingLeft: 10 }}>Switch Theme</span>
          ) : null}
        </Tooltip>
      </Menu.Item>
    );
  }

  menuItems.push(
    <Menu.Item
      key="question"
      onClick={() => setInfoModal(true)}
      style={{ margin: 0 }}
    >
      <Tooltip title={breakpoint !== 'lg' ? '' : 'Info'}>
        <QuestionCircleOutlined
          style={
            breakpoint !== 'lg'
              ? { fontSize: '20px', padding: 6 }
              : { fontSize: '20px', padding: 20 }
          }
        />
        {breakpoint !== 'lg' ? <span>Info</span> : null}
      </Tooltip>
    </Menu.Item>
  );

  if (props.logged) {
    menuItems.push(
      <Menu.Item
        key="logout"
        danger
        style={{ margin: 0 }}
        onClick={() => {
          props.tokenLogout();
        }}
      >
        <Tooltip title={breakpoint !== 'lg' ? '' : 'Logout'}>
          <LogoutOutlined
            style={
              breakpoint !== 'lg'
                ? { fontSize: '20px', padding: 6 }
                : { fontSize: '20px', padding: 20 }
            }
          />
          {breakpoint !== 'lg' ? <span>Logout</span> : null}
        </Tooltip>
      </Menu.Item>
    );
  }

  const onSearch = (value, option) => {
    if (option.value) history.push(option.value);
  };

  const menu = (
    <Menu
      className="app-menu"
      selectable={false}
      style={{ lineHeight: '58px' }}
      mode="horizontal"
    >
      {breakpoint !== 'lg' ? (
        <>
          {namespaceSelector}
          <Menu.Item style={{ margin: 0 }}>
            <Dropdown
              overlay={() => <Menu mode={'vertical'}>{menuItems}</Menu>}
              trigger={'click'}
            >
              <div>
                <EllipsisOutlined
                  style={{
                    fontSize: 20,
                    padding: 20,
                    paddingLeft: 40,
                    paddingRight: 40,
                    margin: 0
                  }}
                />
              </div>
            </Dropdown>
          </Menu.Item>
        </>
      ) : (
        menuItems
      )}
    </Menu>
  );

  return (
    <div>
      {resizeDetector(() => {}, setBreakpoint)}
      <Header className="app-header">
        <div className="container">
          <Row className="app-title" align="middle">
            {!_.isEmpty(window.api.dashConfigs.current) &&
            window.api.dashConfigs.current.spec.header &&
            window.api.dashConfigs.current.spec.header.alternativeLogo ? (
              <Col>
                <Link to={'/'}>
                  <img
                    src={
                      window.api.dashConfigs.current.spec.header.alternativeLogo
                    }
                    style={{
                      margin: '8px 16px 16px 0px',
                      filter: 'drop-shadow(0px 0px 2px black)',
                      height: 40
                    }}
                    alt="image"
                  />
                </Link>
              </Col>
            ) : null}
            {!_.isEmpty(window.api.dashConfigs.current) &&
            window.api.dashConfigs.current.spec.header &&
            window.api.dashConfigs.current.spec.header.alternativeTitle ? (
              <Col>
                <Link to={'/'}>
                  <div style={{ margin: '8px 16px 16px 0px' }}>
                    <Typography.Title level={2} style={{ fontWeight: 'bold' }}>
                      {
                        window.api.dashConfigs.current.spec.header
                          .alternativeTitle
                      }
                    </Typography.Title>
                  </div>
                </Link>
              </Col>
            ) : null}
            {!_.isEmpty(window.api.dashConfigs.current) &&
            window.api.dashConfigs.current.spec.header &&
            window.api.dashConfigs.current.spec.header.resourceSearch ? (
              <Col>
                <ResourceAutocomplete
                  onSearch={onSearch}
                  style={{ width: '22vw', marginLeft: 5, lineHeight: '31px' }}
                />
              </Col>
            ) : null}
          </Row>
        </div>
      </Header>
      {menu}
      <Modal
        title="LiqoDash Information"
        visible={infoModal}
        footer={null}
        centered
        onCancel={() => setInfoModal(false)}
      >
        <Row align={'middle'} gutter={[0, 20]}>
          <Col span={2}>
            <GithubOutlined style={{ fontSize: '32px' }} />
          </Col>
          <Col span={7}>
            <Typography.Text strong>LiqoDash Github</Typography.Text>
          </Col>
          <Col span={15}>
            <Typography.Text strong copyable type="secondary">
              https://github.com/liqotech/dashboard
            </Typography.Text>
          </Col>
        </Row>
        <Row align={'middle'}>
          <Col span={2}>
            <GithubOutlined style={{ fontSize: '32px' }} />
          </Col>
          <Col span={7}>
            <Typography.Text strong>Liqo Github</Typography.Text>
          </Col>
          <Col span={15}>
            <Typography.Text strong copyable type="secondary">
              https://github.com/liqotech/liqo
            </Typography.Text>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}

export default withRouter(AppHeader);
