import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from 'antd';
import './ErrorRedirect.css'
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
import Cookies from 'js-cookie';

export default class ErrorRedirect extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      desc: ''
    }
    Cookies.remove('token');
  }

  componentDidMount() {
    let desc = '';
    switch(this.props.match.params.statusCode){
      case '401':
        desc = 'Forbidden, not valid authentication credentials';
        break;
      case '403':
        desc = 'It seems you do not have the right permissions to perform this operation';
        break;
      case '404':
        desc = 'Resource not found, probably you have already destroyed it';
        break;
      default:
        desc = 'An error occurred, please login again';
    }
    this.setState({desc: desc});
  }

  render() {
    return(
        <div className="error-red">
          <h1 className="title">
            {this.props.match.params.statusCode}
          </h1>
          <div className="desc">
            {this.state.desc}
          </div>
            <Button className="go-back-btn"
                    type="primary" size="large"
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      if(this.props.authManager.OIDC)
                        this.props.authManager.logout();
                      else
                        this.props.tokenLogout();
                    }}>
              Logout
            </Button>
        </div>
    )
  }
}
