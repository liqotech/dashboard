import React, { Component } from 'react';
import './Login.css';
import { Form, Input, Button, Icon, notification, Typography } from 'antd';
import { Redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import ApiManager from '../services/ApiManager';

class Login extends Component {
  constructor(props) {
    super(props);

    /** First check if the token has been passed as a query parameter in the URL */
    let search = window.location.search;
    let params = new URLSearchParams(search);
    let token = params.get('token');

    if(token){
      this.props.func(token);
    }else{
      if(Cookies.get('token')){
        this.props.func(Cookies.get('token'));
      }
    }
  }

  onFinish = values => {
    this.props.func(values.token);
  }

  render() {
    if(!this.props.func || this.props.logged) {
      return <Redirect
        to={{
          pathname: "/",
          state: { from: this.props.location }
        }}/>;
    }

    return (
      <div className={'login-container'}>
        <Typography.Title style={{marginBottom: 50, fontSize: 50}}>
          Liqo Login
        </Typography.Title>
        <Form onFinish={this.onFinish} className="login-form">
          <Form.Item
            validateTrigger={'onSubmit'}
            name="token"
            rules={[
              { required: true, message: 'Please input your token!' },
              { validator: async (rule, value) => {
                if(value){
                  let user = {
                    id_token: value
                  };
                  let api = new ApiManager(user);
                  /** Get the CRDs at the start of the app */
                  return api.getCRDs().then(() => {
                    return Promise.resolve();
                  }).catch(() => {
                    return Promise.reject('Token is not valid');
                  })
                }}
              }
            ]}>
            <Input.Password aria-label={'lab'}  placeholder={'Please input your secret token'}/>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" className="login-form-button" >Login</Button>
          </Form.Item>
        </Form>
      </div>

    );
  }
}


export default Login;
