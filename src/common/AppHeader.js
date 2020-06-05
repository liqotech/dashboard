import React, { Component } from 'react';
import {
    Link,
    withRouter
} from 'react-router-dom';
import './AppHeader.css';
import { Col, Layout, Menu, Row, Input, Divider, AutoComplete } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import NotificationOutlined from '@ant-design/icons/lib/icons/NotificationOutlined';
import { APP_NAME } from '../constants';
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
const Header = Layout.Header;
const { Title } = Typography;
    
class AppHeader extends Component {
    constructor(props) {
      super(props);
      this.autoCompleteSearch = this.autoCompleteSearch.bind(this);
      this.state = {
        CRDs: []
      }
      this.onSearch = this.onSearch.bind(this);
      if(this.props.api){
        this.props.api.autoCompleteCallback = this.autoCompleteSearch;
      }
    }

    autoCompleteSearch(CRDs){
      let tempCRDs = [];

      CRDs.forEach(item =>{
        tempCRDs.push({
          value: item.spec.names.kind,
          singular: item.spec.names.singular,
          name: item.metadata.name
        })
      });

      this.setState({CRDs: tempCRDs});
    }

    onSearch(value){
      let CRD = this.state.CRDs.find(item=>{
        if(item.value === value || item.singular === value){
          return item;
        }
      });

      if(CRD){
        this.props.history.push("/customresources/" + CRD.name);
      }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
      if(!prevProps.api && this.props.api){
        this.setState({CRDs: this.props.api.CRDs});
        this.props.api.autoCompleteCallback = this.autoCompleteSearch;
      }
    }

  render() {
      const options = this.state.CRDs;

      let menuItems;

      menuItems =
      [
        <Menu.Item key="/">
          <NotificationOutlined style={{ fontSize: '20px' }} />
        </Menu.Item>,
        <Menu.Item key="/question">
          <QuestionCircleOutlined style={{ fontSize: '20px' }} />
        </Menu.Item>
      ];

      if(this.props.logged){
        menuItems.push(
          <Menu.Item key="logout" >
            <LogoutOutlined style={{ fontSize: '20px', color: 'rgba(220,21,21,0.79)' }} onClick={this.props.logout} />
          </Menu.Item>
        )
      }

      return (
        <Header className="app-header">
          <div className="container">
            <Row className="app-title" align="middle">
              <Col>
                <img src={require('../assets/logo.png')} className="image" alt="image"/>
                <Link to="/">
                  <Title level={3} style={{color: '#326be2'}} className="title">{APP_NAME}</Title>
                </Link>
              </Col>
              <Col>
                <Divider type="vertical" style={{marginLeft: 70, height: 40}}/>
              </Col>
              <Col>
                <AutoComplete
                  filterOption={(inputValue, option) =>
                    option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                  options={options}
                  onSelect={this.onSearch}
                  style={{ width: 400, marginLeft: 20, lineHeight: '35px' }}
                >
                  <Input.Search placeholder="input CRD" enterButton onSearch={this.onSearch} />
                </AutoComplete>
              </Col>
            </Row>
            <Menu
              className="app-menu"
              mode="horizontal"
              style={{ lineHeight: '64px' }} >
                {menuItems}
            </Menu>
          </div>
        </Header>
      );
    }
}

export default withRouter(AppHeader);
