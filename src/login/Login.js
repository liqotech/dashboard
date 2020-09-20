import React from 'react';
import './Login.css';
import { Form, Input, Button, Typography } from 'antd';
import { Redirect } from 'react-router-dom';
import Cookies from 'js-cookie';
import ApiManager from '../services/ApiManager';

function Login(props){

  /** First check if the token has been passed as a query parameter in the URL */
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const token = params.get('token');

  if(token){
    props.func(token);
  }else{
    if(Cookies.get('token')){
      props.func(Cookies.get('token'));
    }
  }

  const onFinish = values => {
    props.func(values.token);
  }


  if(!props.func || props.logged) {
    return <Redirect
      to={{
        pathname: "/",
        state: { from: props.location }
      }}/>;
  }

  return (
    <div className={'login-container'}>
      <Typography.Title style={{marginBottom: 50, fontSize: 50}}>
        Liqo Login
      </Typography.Title>
      <Form onFinish={onFinish} className="login-form">
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
                return api.getNodes().then(() => {
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


export default Login;
