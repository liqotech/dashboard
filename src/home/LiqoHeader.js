import React, { useEffect, useState } from 'react';
import { Alert, Row, Button, Input, PageHeader, Select, Space, Tag, Tooltip, Typography } from 'antd';
import AuditOutlined from '@ant-design/icons/lib/icons/AuditOutlined';
import CopyOutlined from '@ant-design/icons/lib/icons/CopyOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import { Link } from 'react-router-dom';
import { LIQO_NAMESPACE } from '../constants';

function LiqoHeader(props) {

  const [clusterID, setClusterID] = useState('')

  useEffect(() => {
    window.api.getConfigMaps(LIQO_NAMESPACE, 'metadata.name=cluster-id').then(res => {
      setClusterID(res.body.items[0].data['cluster-id']);
    }).catch(error => {console.log(error)})
  }, [])

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
      <PageHeader style={{paddingTop: '0.5em', paddingBottom: '0.5em'}}
                  title={<Typography.Text strong style={{fontSize: '2em'}}>LIQO</Typography.Text>}
                  tags={
                    <Row align={'middle'}>
                      {running ? <Tag color="blue">Running</Tag> : <Tag color="red">Stopped</Tag>}
                      <Tag>
                        <Row>
                          <Space>
                            <Typography.Text>Cluster ID:</Typography.Text>
                            <Typography.Paragraph style={{margin: 0}} copyable>{clusterID}</Typography.Paragraph>
                          </Space>

                        </Row>
                      </Tag>
                    </Row>
                  }
                  extra={
                    <Row align={'middle'} >
                      <Space size={'large'} style={{fontSize: 24}}>
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
                    </Row>
                  }
      />
    </div>
  )
}

export default LiqoHeader;
