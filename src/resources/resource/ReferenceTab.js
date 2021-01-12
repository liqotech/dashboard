import React, { useEffect, useState } from 'react';
import {
  Dropdown,
  Card,
  Row,
  Col,
  Alert,
  Tooltip,
  Switch,
  Collapse,
  Typography,
  Menu,
  InputNumber
} from 'antd';
import GraphNet from '../../widgets/graph/GraphNet';
import ResourceForm from './ResourceForm';
import { searchDirectReferences, searchResourceByKindAndGroup } from '../common/ResourceUtils';
import { LoadingOutlined, LoginOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

export default function ReferenceTab(props) {
  const [linkedLabelResources, setLinkedLabelResources] = useState([]);
  const [linkedOwnerRefResources, setLinkedOwnerRefResources] = useState([]);
  const [linkedDirectResources, setLinkedDirectResources] = useState([]);
  const [showRef, setShowRef] = useState(['directRef', 'ownerRef', undefined]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDepth, setSearchDepth] = useState(2);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if(props.onCustomResource){
      setLinkedDirectResources(prev => {
        prev = [{
          ...props.resource,
          level: 0
        }];
        getLinkedByDirect(
          props.resource.kind + '_' + props.resource.metadata.name,
          props.resource.spec,
          1
        )
        return [...prev];
      })
    }

    setLinkedOwnerRefResources(prev => {
      prev = [{
        ...props.resource,
        level: 0
      }];
      if(props.resource.metadata.ownerReferences)
        getLinkedByOwnerRef(
          props.resource.kind + '_' + props.resource.metadata.name,
          props.resource.metadata.ownerReferences,
          1
        );
      return [...prev];
    });

    setLinkedLabelResources(prev => {
      prev = [{
        ...props.resource,
        level: 0
      }];
      if(props.resource.metadata.labels)
        getLinkedByLabel(props.resource.kind + '_' + props.resource.metadata.name, props.resource.metadata.labels, 1);
      return [...prev];
    });
  }, [searchDepth]);

  function getLinkedByDirect(parent, spec, level) {
    if(level > searchDepth) return;

    setLoading(true);

    let res = searchDirectReferences(spec);
    res.forEach(item => {
      setLoading(true);
      searchResourceByKindAndGroup(_.keys(item)[0].slice(0, -3).split('/')[1], _.keys(item)[0].split('/')[0].split('.').slice(1).join('.'))
        .then(res => {
          if(res){
            let direct = res.items.find(i => i.metadata.name === item[_.keys(item)[0]].name);
            setLinkedDirectResources(prev => {
              if (
                !prev.find(i => i.metadata.selfLink ===
                  direct.metadata.selfLink)
              ) {
                prev.push({
                  ...direct,
                  level: direct.kind === props.resource.kind ? level - 1 : level,
                  parent: parent
                });
                getLinkedByDirect(direct.kind + '_' + direct.metadata.name, direct.spec, level + 1);
                setLoading(false);
                return [...prev];
              }
              setLoading(false);
              return prev;
            })
          }
        })
    })
  }

  function getLinkedByOwnerRef(parent, refs, level) {
    if(level > searchDepth) return;

    setLoading(true);

    refs.forEach(ref => {
      window.api.getGenericResource('/apis/' + ref.apiVersion).then(res => {
        setLoading(true);
        let refRes = res.resources.find(resource => resource.kind === ref.kind);
        if (refRes) {
          window.api
            .getGenericResource(
              '/apis/' +
              ref.apiVersion +
              '/' +
              refRes.name +
              '?fieldSelector=metadata.name=' +
              ref.name
            )
            .then(_res => {
              setLinkedOwnerRefResources(prev => {
                _res.items.forEach(item => {
                  setLoading(true);
                  prev.push({
                    ...item,
                    kind: _res.kind.slice(0, -4),
                    level: level,
                    parent: parent
                  });
                  if (item.metadata.ownerReferences)
                    getLinkedByOwnerRef(
                      _res.kind.slice(0, -4) + '_' + item.metadata.name,
                      item.metadata.ownerReferences,
                      level + 1
                    );
                });
                setLoading(false);
                return [...prev];
              });
            });
        }
      });
    });
  }

  function getLinkedByLabel(parent, labels, level) {
    if(level > searchDepth) return;

    setLoading(true);
    
    function setLabels(__res){
      if (__res.items.length > 0) {
        setLinkedLabelResources(prev => {
          let previous = prev.length;
          __res.items.forEach(item => {
            setLoading(true);
            if (
              !prev.find(i => i.metadata.selfLink ===
                item.metadata.selfLink)
            ) {
              prev.push({
                ...item,
                kind: __res.kind.slice(0, -4),
                level: __res.kind.slice(0, -4) === parent.split('_')[0] ? level - 1 : level,
                parent: parent
              });
              if(item.metadata.labels)
                getLinkedByLabel(__res.kind.slice(0, -4) + '_' + item.metadata.name, item.metadata.labels, level + 1);
            }
          });
          setLoading(false);
          if(prev.length === previous){
            return prev;
          }
          return [...prev];
        });
      }
    }

    for(const key of Object.keys(labels)) {
      if (!key.includes('app.kubernetes')) {
        let label = key + '=' + labels[key];
        window.api
          .getApis('/')
          .then(res => {
            setLoading(true);
            res.body.groups.forEach(group => {
              setLoading(true);
              if (
                group.preferredVersion.groupVersion !==
                  'authorization.k8s.io/v1' &&
                group.preferredVersion.groupVersion !==
                  'authentication.k8s.io/v1'
              ) {
                window.api
                  .getGenericResource(
                    '/apis/' + group.preferredVersion.groupVersion
                  )
                  .then(_res => {
                    _res.resources.forEach(resource => {
                      setLoading(true);
                      if (resource.name.split('/').length < 2)
                        window.api
                          .getGenericResource(
                            '/apis/' +
                              group.preferredVersion.groupVersion +
                              '/' +
                              resource.name +
                              '?labelSelector=' +
                              label
                          )
                          .then(__res => {
                            setLabels(__res);
                          })
                          .catch(error => console.log(error));
                    });
                  });
              }
            });
          })
          .catch(error => console.log(error));

        window.api
          .getGenericResource('/api/v1')
          .then(_res => {
            _res.resources.forEach(resource => {
              setLoading(true);
              if (resource.name.split('/').length < 2 && resource.name !== 'bindings')
                window.api
                  .getGenericResource(
                    '/api/v1/' + resource.name + '?labelSelector=' + label
                  )
                  .then(__res => {
                    setLoading(true);
                    setLabels(__res);
                  })
                  .catch(error => console.log(error));
            });
          })
          .catch(error => console.log(error));
      }
    }
  }

  const selectNode = sel => {
    function createCard(res){
      return (
        <Collapse.Panel header={<Typography.Text strong>{res.metadata.name}</Typography.Text>}
                        size={'small'}
                        style={{ marginLeft: -1, marginRight: -1 }}
                        key={'ref_' + res.metadata.name + Math.random()}
                        extra={
                          <Tooltip title={'Go to ' + res.metadata.name}>
                            <Link style={{ color: 'rgba(0, 0, 0, 0.85)'}} to={{
                              pathname: res.metadata.selfLink
                            }} >
                              <LoginOutlined />
                            </Link>
                          </Tooltip>
                          }
        >
          <ResourceForm
            noSearch
            readonly
            resource={JSON.parse(JSON.stringify(res))}
            updateFunc={null}
            kind={res.kind}
          />
        </Collapse.Panel>
      )
    }

    let res;

    if (sel.split('/')[0] === 'cluster') {
      let _kind = sel.split('/')[1].split('_')[0];
      res = linkedLabelResources.filter(item => {
        return (
          item.kind === _kind
        );
      });
      if (res.length === 0)
        res = linkedOwnerRefResources.filter(item => {
          return (
            item.kind === _kind
          );
        });
      if (res.length === 0)
        res = linkedDirectResources.filter(item => {
          return (
            item.kind === _kind
          );
        });

      if(res){
        setSelected([]);
        res.forEach(r => {
          setSelected(prev => [...prev,
            createCard(r)
          ])
        })
      }
    } else {
      res = linkedLabelResources.find(item => {
        return (
          item.kind === sel.split('_')[0] &&
          item.metadata.name === sel.split('_')[1]
        );
      });
      if (!res)
        res = linkedOwnerRefResources.find(item => {
          return (
            item.kind === sel.split('_')[0] &&
            item.metadata.name === sel.split('_')[1]
          );
        });
      if (!res)
        res = linkedDirectResources.find(item => {
          return (
            item.kind === sel.split('_')[0] &&
            item.metadata.name === sel.split('_')[1]
          );
        });

      if(res){
        setSelected([
          createCard(res)
        ])
      }
    }
  };

  const extra = (
    <Dropdown placement={'bottomRight'}
              key={'dropdown_link'}
              trigger={['click']}
              onVisibleChange={visible => setDropdownVisible(visible)}
              visible={dropdownVisible}
              overlay={
                <Menu>
                  <Menu.Item key={'direct_switch'}>
                    <span>
                      Direct Reference
                    </span>
                    <span style={{float: 'right'}}>
                      <Switch
                        size={'small'}
                        defaultChecked
                        style={{ marginLeft: 10 }}
                        onChange={checked => {
                          checked
                            ? setShowRef(prev => {
                              prev[0] = 'directRef';
                              return [...prev]
                            })
                            : setShowRef(prev => {
                              prev[0] = undefined;
                              return [...prev];
                            });
                        }}
                      />
                    </span>
                  </Menu.Item>
                  <Menu.Item key={'owner_switch'}>
                    <span>
                      Owner Reference
                    </span>
                    <span style={{float: 'right'}}>
                      <Switch
                        size={'small'}
                        defaultChecked
                        style={{ marginLeft: 10 }}
                        onChange={checked => {
                          checked
                            ? setShowRef(prev => {
                              prev[1] = 'ownerRef';
                              return [...prev]
                            })
                            : setShowRef(prev => {
                              prev[1] = undefined;
                              return [...prev];
                            });
                        }}
                      />
                    </span>
                  </Menu.Item>
                  <Menu.Item key={'labels_switch'}>
                    <span>
                      Label Reference
                    </span>
                    <span style={{float: 'right'}}>
                      <Switch
                        size={'small'}
                        defaultChecked={false}
                        style={{ marginLeft: 10 }}
                        onChange={checked => {
                          checked
                            ? setShowRef(prev => {
                              prev[2] = 'labelRef';
                              return [...prev]
                            })
                            : setShowRef(prev => {
                              prev[2] = undefined;
                              return [...prev];
                            });
                        }}
                      />
                    </span>
                  </Menu.Item>
                  <Menu.Item key={'set_deep'}>
                    <span>
                      Search Depth
                    </span>
                    <span style={{float: 'right'}}>
                      <InputNumber defaultValue={3}
                                   style={{ marginLeft: 10 }}
                                   size={'small'}
                                   onChange={depth => {
                                     setSearchDepth(depth)
                                   }}
                      />
                    </span>
                  </Menu.Item>
                </Menu>
              }
    >
      <Tooltip title={'Advanced settings'} >
        <SettingOutlined />
      </Tooltip>
    </Dropdown>
  )

  return (
    <Alert.ErrorBoundary>
      <Row gutter={16}>
        <Col span={18}>
          <Card
            title={'Resource Graph'}
            size={'small'}
            type={'inner'}
            extra={[
              loading ? <LoadingOutlined key={'ref_loading'} style={{marginRight: 10}} /> : null,
              extra
            ]}
            bodyStyle={{ padding: 0 }}
            className={'scrollbar'}
          >
            <GraphNet
              onRef={{
                ownerRef: linkedOwnerRefResources,
                labelRef: linkedLabelResources,
                directRef: linkedDirectResources
              }}
              selectNode={selectNode}
              showRef={showRef}
              style={{ height: '62vh' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card
            title={'Selected Resources'}
            size={'small'}
            type={'inner'}
            bodyStyle={{ padding: 0, paddingTop: 1, height: '62vh' }}
            className={'scrollbar'}
          >
            <Collapse>
              {selected}
            </Collapse>
          </Card>
        </Col>
      </Row>
    </Alert.ErrorBoundary>
  );
}
