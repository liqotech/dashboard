import React, { Component } from 'react';
import { Button, Input, PageHeader, Select, Space, Tag, Tooltip, Typography } from 'antd';
import AuditOutlined from '@ant-design/icons/lib/icons/AuditOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import { Link } from 'react-router-dom';

class LiqoHeader extends Component {
  constructor(props) {
    super(props);
  }

  render (){

    const running = true;

    //TODO: get the mode options from the config (not yet available)
    const selectMode = (
      <Select defaultValue={'Autonomous'}>
        <Select.Option value="Autonomous">
          <Tooltip placement={'left'} title={'Let LIQO decide who to share resources with'}>
            Autonomous
          </Tooltip>
        </Select.Option>
        <Select.Option value="Tethered">
          <Tooltip placement={'left'} title={'Choose to connect to a single foreign LIQO peer'}>
            Tethered
          </Tooltip>
        </Select.Option>
      </Select>
    )

    return (
      <div className="home-header" style={{marginBottom: 16, height: '100%'}}>
        <PageHeader style={{paddingTop: 4, paddingBottom: 4}}
                    title={
                      <Typography.Text strong style={{fontSize: '2em'}}>LIQO</Typography.Text>
                    }
                    tags={ running ? <Tag color="blue">Running</Tag> : <Tag color="red">Stopped</Tag>}
                    extra={
                      <Space size={'large'} style={{fontSize: 25, marginBottom: 10}}>
                        <Input.Group compact>
                          <Tooltip title={'Change LIQO functioning mode'}>
                            <Button type={'primary'}>MODE</Button>
                          </Tooltip>
                          {selectMode}
                        </Input.Group>
                        <Tooltip title={'Policies'}>
                          <Link to={{ pathname: '/policies/' }}
                                style={{color: 'inherit',textDecoration: 'none'}}>
                            <AuditOutlined key={'liqo-home-header-policies'}/>
                          </Link>
                        </Tooltip>
                        <Tooltip title={'Settings'}>
                          <Link to={{ pathname: '/settings/' }}
                                style={{color: 'inherit',textDecoration: 'none'}}>
                            <SettingOutlined key={'liqo-home-header-setting'}/>
                          </Link>
                        </Tooltip>
                      </Space>
                    }
        />
      </div>
    )
  }
}

export default LiqoHeader;
