import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Divider, Layout } from 'antd';
const Footer = Layout.Footer;
import './AppFooter.css';

class AppFooter extends Component {
  constructor(props) {
    super(props);
  }

  render() {
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
}

export default withRouter(AppFooter)
