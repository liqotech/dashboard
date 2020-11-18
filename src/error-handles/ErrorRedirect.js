import React, { useEffect, useState } from 'react';
import { Result, Button, Card } from 'antd';
import './ErrorRedirect.css'
import LogoutOutlined from '@ant-design/icons/lib/icons/LogoutOutlined';
import {
  useHistory
} from 'react-router-dom';

export default function ErrorRedirect(props) {
  const [description, setDescription] = useState('');
  let history = useHistory();

  useEffect(() => {
    let desc = '';
    switch(props.match.params.statusCode.toString()){
      case '401':
        desc = 'Forbidden, not valid authentication credentials';
        break;
      case '403':
        desc = 'You do not have the right permissions to access this resource';
        break;
      case '404':
        desc = 'This page do not exist';
        break;
      default:
        desc = 'An error occurred, please login again';
    }
    setDescription(desc);
  }, []);

  return(
    <Card>
      <Result
        status="error"
        title={props.match.params.statusCode}
        subTitle={description}
        extra={
          <Button className="go-back-btn"
                  type="primary" size="large"
                  icon={<LogoutOutlined />}
                  onClick={() => {
                    props.tokenLogout ? props.tokenLogout() : history.goBack()
                  }}>
            {props.tokenLogout ? 'Logout' : 'Go Back'}
          </Button>
        }
      />
    </Card>
  )
}
