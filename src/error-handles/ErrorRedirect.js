import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import './ErrorRedirect.css'
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
import Cookies from 'js-cookie';

export default function ErrorRedirect(props) {
  const [description, setDescription] = useState('');

  useEffect(() => {
    Cookies.remove('token');
    let desc = '';
    switch(props.match.params.statusCode){
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
    setDescription(desc);
  }, []);

  return(
      <div className="error-red">
        <h1 className="title">
          {props.match.params.statusCode}
        </h1>
        <div className="desc">
          {description}
        </div>
          <Button className="go-back-btn"
                  type="primary" size="large"
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    if(props.authManager.OIDC)
                      props.authManager.logout();
                    else
                      props.tokenLogout();
                  }}>
            Logout
          </Button>
      </div>
  )
}
