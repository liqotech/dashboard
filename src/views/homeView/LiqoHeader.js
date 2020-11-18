import React, { useEffect, useState } from 'react';
import { Row, Button, Input, PageHeader, Select, Space, Tag, Tooltip, Typography, Card } from 'antd';
import AuditOutlined from '@ant-design/icons/lib/icons/AuditOutlined';
import SettingOutlined from '@ant-design/icons/lib/icons/SettingOutlined';
import { Link } from 'react-router-dom';
import { LIQO_NAMESPACE } from '../../constants';

function LiqoHeader(props) {

  const [clusterID, setClusterID] = useState('');
  const [clusterName, setClusterName] = useState(props.config ? props.config.spec.discoveryConfig.clusterName : null);
  const [onEdit, setOnEdit] = useState(false);

  useEffect(() => {
    window.api.getConfigMaps(LIQO_NAMESPACE, 'metadata.name=cluster-id').then(res => {
      setClusterID(res.body.items[0].data['cluster-id']);
    }).catch(error => {console.log(error)})
  }, [])

  const saveClusterName = () => {
    setOnEdit(false);
    let prevClusterName = props.config.spec.discoveryConfig.clusterName;
    props.config.spec.discoveryConfig.clusterName = clusterName;
    let array = props.config.metadata.selfLink.split('/');
    window.api.updateCustomResource(
      array[2],
      array[3],
      null,
      array[4],
      array[5],
      props.config
    ).catch(() => {
      props.config.spec.discoveryConfig.clusterName = prevClusterName;
      setClusterName(props.config.spec.discoveryConfig.clusterName);
    });
  }

  const running = !!props.config;

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
    <Card bodyStyle={{padding: 0}} style={{marginBottom: 20}}>
      <PageHeader style={{paddingTop: '0.5em', paddingBottom: '0.5em'}}
                  title={
                    <div>
                      { onEdit ? <Input size={'small'} value={clusterName} style={{fontSize: '1em'}}
                                        onBlur={saveClusterName} autoFocus
                                        onChange={(value) => {setClusterName(value.target.value)}}
                                        onPressEnter={saveClusterName}
                        /> :
                        <div onClick={() => props.config ? setOnEdit(true) : null}>
                          <Tooltip title={'Rename cluster'}>
                            <Typography.Text strong style={{fontSize: '1.5em'}}>{clusterName ? clusterName : 'LIQO'}</Typography.Text>
                          </Tooltip>
                        </div>
                      }
                    </div>
                  }
                  tags={
                    <Row align={'middle'}>
                      {running ? <Tag color="blue">Running</Tag> :
                        props.config ? <Tag color="red">Stopped</Tag> : <Tag color="red">Not Installed</Tag>}
                      {props.config ? (
                        <Tag>
                          <Row>
                            <Space>
                              <Typography.Text>Cluster ID:</Typography.Text>
                              <Typography.Paragraph style={{margin: 0}} copyable>{clusterID}</Typography.Paragraph>
                            </Space>
                          </Row>
                        </Tag>
                      ) : null}
                    </Row>
                  }
                  extra={
                    props.config ? (
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
                    ) : null
                  }
      />
    </Card>
  )
}

export default LiqoHeader;
