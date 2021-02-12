import React from 'react';
import './Login.css';
import Utils from '../services/Utils';
import { Button, Card, Form, Input, Typography } from 'antd';

function Login(props) {
  const onFinish = values => {
    props.func(values.token);
  };

  const validator = (rule, value) => {
    try {
      Utils().parseJWT(value);
    } catch {
      return Promise.reject('Token is not valid');
    }
  };

  return (
    <div className={'login-container'}>
      <Card bordered={false}>
        <Typography.Title style={{ marginBottom: 50, fontSize: 50 }}>
          Liqo<span style={{ fontStyle: 'italic' }}>Dash</span> Login
        </Typography.Title>
        <Form onFinish={onFinish} className="login-form">
          <Form.Item
            validateTrigger={'onSubmit'}
            name="token"
            rules={[
              { required: true, message: 'Please input your token!' },
              { validator: async (rule, value) => validator(rule, value) }
            ]}
          >
            <Input.Password
              aria-label={'lab'}
              placeholder={'Please input your secret token'}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="login-form-button"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;
