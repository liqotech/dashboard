import React, { useEffect, useState } from 'react';
import { Drawer, Button, Tooltip, Col, Badge, Typography, Row, Input, Space, Popover, Popconfirm } from 'antd';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import dark from '../themes/dark.json';
import light from '../themes/light.json';
import _ from 'lodash';
import ColorPicker from './ColorPicker';
import { handleSave } from '../services/SaveUtils';
import ThemeUploader from './ThemeUploader';
import darkTheme from './dark-theme.less';

export default function ThemeModifier(){
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState([]);

  const changeTheme = (key, color) => {
    let theme = {...JSON.parse(localStorage.getItem('theme')), [key]: color};
    window.less.modifyVars(theme)
      .then(() => {
        console.log(theme);
        localStorage.setItem('theme', JSON.stringify(theme));
      });
  }

  const changeItems = theme => {
    setItems([]);
    _.keys(dark).forEach(key => {
      setItems(prev => [...prev, (
        <div key={key}>
          <Row align="middle" gutter={[20, 0]}>
            <Col span={20}>
              <Badge status="default"/>
              <Typography.Text strong>{key}</Typography.Text>
            </Col>
            <Col>
              <ColorPicker parameter={key} color={theme[key]} updateFunc={changeTheme} />
            </Col>
          </Row>
        </div>
      )]);
    })
  }

  const setTheme = () => {
    if(localStorage.getItem('theme') === 'dark' || !localStorage.getItem('theme'))
      localStorage.setItem('theme', JSON.stringify(dark));
    else if(localStorage.getItem('theme') === 'light')
      localStorage.setItem('theme', JSON.stringify(light));

    let theme = JSON.parse(localStorage.getItem('theme'));

    changeItems(theme);
  }

  useEffect(() => {
    setTheme();
  }, [visible])

  const resetTheme = () => {
    window.less.modifyVars(dark)
      .then(() => localStorage.setItem('theme', 'dark'));
  }

  return(
    <div>
      <Tooltip title={'Modify theme'} >
        <SettingOutlined onClick={() => setVisible(prev => !prev)}
                         style={{fontSize: 20, paddingLeft: 20, paddingRight: 10}}
        />
      </Tooltip>
      <Drawer
        title={'Theme customizer'}
        onClose={() => setVisible(false)}
        visible={visible}
        destroyOnClose
        width={'20%'}
        footer={
          <Row>
            <Col span={8}>
              <Popover trigger={'click'}
                       content={<ThemeUploader changeItems={changeItems}/>}
              >
                <Button>
                  Import Theme
                </Button>
              </Popover>
            </Col>
            <Col span={16}>
              <div
                style={{
                  textAlign: 'right',
                }}
              >
                <Popconfirm title={'Reset theme?'}
                            onConfirm={resetTheme}
                >
                  <Button style={{marginRight: 8}}>
                    Reset
                  </Button>
                </Popconfirm>
                <Button type="primary"
                        onClick={() => handleSave(localStorage.getItem('theme'), 'liqodash-custom-theme')}
                >
                  Export
                </Button>
              </div>
            </Col>
          </Row>
        }
      >
        <Space direction={'vertical'} size={'small'} style={{width: '100%'}}>
          {items}
        </Space>
      </Drawer>
    </div>
  )
}
