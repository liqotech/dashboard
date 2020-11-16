import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { Layout, Row, Col, Typography } from 'antd';
const Footer = Layout.Footer;
import './AppFooter.css';
import _ from 'lodash';
import GitHubButton from 'react-github-btn';

function AppFooter() {
  const [, setConfig] = useState(window.api.dashConfigs.current);

  useEffect(() => {
    window.api.DCArrayCallback.current.push(() => setConfig(window.api.dashConfigs.current));
  }, []);

  if(!_.isEmpty(window.api.dashConfigs.current) &&
    window.api.dashConfigs.current.spec.footer && window.api.dashConfigs.current.spec.footer.enabled){
    const footer = window.api.dashConfigs.current.spec.footer;
    return (
      <Footer className={'app-footer'}>
        <Row align={'middle'} justify={'center'}>
          <Col>
            <div style={{marginRight: 20}}>
              <Typography.Text strong>{footer.footerDescription}</Typography.Text>
            </div>
          </Col>
          <Col>
            {footer.githubRef ? (
              <div style={{marginBottom: -6}}>
                <GitHubButton
                  href={footer.link}
                  data-size="large"
                  data-show-count="true"
                >
                  Star
                </GitHubButton>
              </div>
            ) : null}
          </Col>
        </Row>
      </Footer>
    );
  } else return <div/>
}

export default withRouter(AppFooter)
