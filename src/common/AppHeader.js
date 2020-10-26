import React, { useState } from 'react';
import {
  withRouter, useHistory
} from 'react-router-dom';
import './AppHeader.css';
import { Select, Modal, Col, Layout, Menu, Row, Input, AutoComplete, Typography, Button } from 'antd';
import { GithubOutlined, QuestionCircleOutlined, SelectOutlined } from '@ant-design/icons';
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
import NamespaceSelect from './NamespaceSelect';
import { ResourceAutocomplete } from './ResourceAutocomplete';
const Header = Layout.Header;

function AppHeader(props) {
  const [infoModal, setInfoModal] = useState(false);
  let history = useHistory();
  let menuItems;

  menuItems =
    [
      <Menu.Item key="namespace" style={{ margin: 0 }}>
        <NamespaceSelect />
      </Menu.Item>,
      <Menu.Item key="question" onClick={() => setInfoModal(true)}
                 style={{ margin: 0 }}
      >
        <QuestionCircleOutlined style={{ fontSize: '20px', padding: 20 }} />
      </Menu.Item>
    ];

  if(props.logged){
    menuItems.push(
      <Menu.Item key="logout" danger
                 style={{ margin: 0 }}
                 onClick={() => {
        props.tokenLogout();
      }}>
        <LogoutOutlined style={{ fontSize: '20px', padding: 20 }}/>
      </Menu.Item>
    )
  }

  const onSearch = (value, option) => {
    if(option.value)
      history.push(option.value);
  }

  return (
    <div>
      <Header className="app-header">
        <div className="container">
          <Row className="app-title" align="middle">
            <Col>
              <ResourceAutocomplete onSearch={onSearch} style={{ width: '22vw', marginLeft: 5, lineHeight: '31px' }}/>
            </Col>
          </Row>
        </div>
      </Header>
      <Menu
        className="app-menu"
        selectable={false}
        style={{ lineHeight: '58px' }}
        mode="horizontal" >
        {menuItems}
      </Menu>
      <Modal
        title="LiqoDash Information"
        visible={infoModal}
        footer={null}
        centered
        onCancel={() => setInfoModal(false)}
      >
        <Row align={'middle'} gutter={[0, 20]}>
          <Col span={2}>
            <GithubOutlined style={{ fontSize: '32px'}}/>
          </Col>
          <Col span={7}>
            <Typography.Text strong>LiqoDash Github</Typography.Text>
          </Col>
          <Col span={15}>
            <Typography.Text strong copyable type="secondary">https://github.com/liqotech/dashboard</Typography.Text>
          </Col>
        </Row>
        <Row align={'middle'}>
          <Col span={2}>
            <GithubOutlined style={{ fontSize: '32px'}}/>
          </Col>
          <Col span={7}>
            <Typography.Text strong>Liqo Github</Typography.Text>
          </Col>
          <Col span={15}>
            <Typography.Text strong copyable type="secondary">https://github.com/liqotech/liqo</Typography.Text>
          </Col>
        </Row>
      </Modal>
    </div>
  );
}

export default withRouter(AppHeader);
