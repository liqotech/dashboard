import React, { useEffect, useState } from 'react';
import {
  withRouter
} from 'react-router-dom';
import './AppHeader.css';
import { Col, Layout, Menu, Row, Input, AutoComplete } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import NotificationOutlined from '@ant-design/icons/lib/icons/NotificationOutlined';
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
import NamespaceSelect from './NamespaceSelect';
const Header = Layout.Header;

function AppHeader(props) {
  const [CRDs, setCRDs] = useState([]);

  const autoCompleteSearch = CRDs => {
    let tempCRDs = [];
    CRDs.forEach(item =>{
      tempCRDs.push({
        value: item.spec.names.kind + '@' + item.metadata.name,
        singular: item.spec.names.singular,
        name: item.metadata.name
      })
    });
    setCRDs(tempCRDs);
  }

  const onSearch = value => {
    let CRD = CRDs.find(item=>{
      if(item.value === value || item.singular === value){
        return item;
      }
    });
    if(CRD){
      props.history.push("/customresources/" + CRD.name);
    }
  }

  useEffect(() => {
    window.api.autoCompleteCallback.current = autoCompleteSearch;
    autoCompleteSearch(window.api.CRDs.current);
  }, []);

  let menuItems;

  menuItems =
    [
      <Menu.Item key="namespace" style={{ margin: 0 }}>
        <NamespaceSelect />
      </Menu.Item>,
      <Menu.Item key="/question">
        <QuestionCircleOutlined style={{ fontSize: '20px' }} />
      </Menu.Item>
    ];

  if(props.logged){
    menuItems.push(
      <Menu.Item key="logout" >
        <LogoutOutlined style={{ fontSize: '20px', color: 'rgba(220,21,21,0.79)' }}
                        onClick={() => {
                          props.tokenLogout();
                        }} />
      </Menu.Item>
    )
  }

  return (
    <div>
      <Header className="app-header">
        <div className="container">
          <Row className="app-title" align="middle">
            <Col>
              <div aria-label={'autocompletesearch'}>
                <AutoComplete
                  filterOption={(inputValue, option) =>
                    option.name.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  options={CRDs}
                  onSelect={onSearch}
                  style={{ width: '22vw', marginLeft: 5, lineHeight: '31px' }}
                >
                  <Input.Search placeholder="input CRD" enterButton onSearch={onSearch} allowClear />
                </AutoComplete>
              </div>
            </Col>
          </Row>
        </div>
      </Header>
      <Menu
        className="app-menu"
        mode="horizontal"
        style={{ lineHeight: '64px' }} >
        {menuItems}
      </Menu>
    </div>
  );
}

export default withRouter(AppHeader);
