import React from 'react';
import { withRouter } from 'react-router-dom';
import { Layout } from 'antd';
const Footer = Layout.Footer;
import './AppFooter.css';

function AppFooter() {

  return (
    <Footer style={{textAlign: 'center', marginTop: 20}}>
      <div>
        <a href=""  target={'_blank'}>
          Liqo @2020
        </a>
      </div>
    </Footer>
  );
}

export default withRouter(AppFooter)
