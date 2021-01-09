import React, { useEffect, useRef, useState } from 'react';
import  { Alert, Badge, Button, Col, Input, Modal, Row, Select, Tooltip, Typography } from 'antd';
import FormViewer from '../../widgets/form/FormViewer';
import { splitCamelCaseAndUp } from '../../services/stringUtils';
import { ArrowsAltOutlined, LinkOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

function ReferenceHandler(props) {
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCR, setSelectedCR] = useState('');
  const [selectedNS, setSelectedNS] = useState('');
  const [onViewer, setonViewer] = useState(props.onViewer);
  let CR = useRef();
  let CRs = useRef([]);
  let NSs = useRef([]);
  let CRD = useRef();
  let CROptions = useRef([]);
  let NSOptions = useRef([]);

  useEffect(() => {

    CRD.current = window.api.getCRDFromKind(props.label.split('/')[1].slice(0, -3));

    if(CRD.current){
      if(onViewer || CRD.current.spec.scope !== 'Namespaced'){
        getCRs();
      } else {
        window.api.getNamespaces().then(res => {
          NSs.current = res.body.items;
          NSs.current.forEach(NS => NSOptions.current.push(
            <Select.Option key={NS.metadata.name} value={NS.metadata.name} children={NS.metadata.name}/>
          ));
          NSOptions.current.push(
            <Select.Option key={'all namespaces'} value={'all namespaces'} children={'all namespaces'}/>
          )
          setSelectedNS('all namespaces')
        })
      }
    }
  }, [onViewer])

  useEffect(() => {
    if(CRD.current) {
      setSelectedCR('');
      getCRs();
    }
  }, [selectedNS])
  
  const getCRs = () => {
    setLoading(true);
    if(onViewer || selectedNS === 'all namespaces'){
      window.api.getCustomResourcesAllNamespaces(CRD.current).then(res => {
        if(!onViewer) {
          CRs.current = res.body.items;

          CROptions.current = [];
          CRs.current.forEach(CR => CROptions.current.push(
            <Select.Option key={CR.metadata.name} value={CR.metadata.name} children={CR.metadata.name}/>
          ));
        } else {
          CR.current = res.body.items.find(item => {
            return item.metadata.name === props.children.props.children[0].props.formData.name
          })
          setSelectedCR(CR.current.metadata.name);
        }

        setLoading(false);
      })
    } else {
      window.api.getCustomResources(CRD.current, selectedNS).then(res => {
        CRs.current = res.body.items;

        CROptions.current = [];
        CRs.current.forEach(CR => CROptions.current.push(
          <Select.Option key={CR.metadata.name} value={CR.metadata.name} children={CR.metadata.name}/>
        ));

        setLoading(false);
      })
    }
  }

  const handleChangeCR = items => {
    setSelectedCR(items);
    props.children.props.children[0].props.onChange({
      name: items,
      namespace: CRs.current.find(CR => CR.metadata.name = items).metadata.namespace
    })
  };

  const handleChangeNS = items => {
    setSelectedNS(items);
  };

  return (
    window.api.getCRDFromKind(props.label.split('/')[1].slice(0, -3)) ? (
      <div>
        <div>
          { NSs.current.length > 0 ? (
            <Row align="middle" gutter={[0, 6]}>
              <Col span={10}>
                <div>
                  <Badge status="processing"/>
                  <Typography.Link strong>Namespace</Typography.Link>
                </div>
              </Col>
              <Col span={14}>
                {loading ? (
                  <Input disabled size={'small'} />
                ) : (
                  <Select
                    allowClear
                    showSearch
                    aria-label={'select'}
                    placeholder={'Select namespace'}
                    value={selectedNS}
                    size={'small'}
                    style={{ width: '100%' }}
                    onChange={handleChangeNS}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                  >
                    {NSOptions.current}
                  </Select>
                )}
              </Col>
            </Row>
          ) : null }
          { CR.current || CRs.current.length > 0 ? (
            <div>
              <div>
                <Row align="middle">
                  <Col span={10}>
                    <div>
                      <Badge status="processing"/>
                      { CR.current ? (
                        <>
                          <Tooltip title={'Open resource'}>
                            <Link to={CR.current.metadata.selfLink}>
                              <Typography.Text strong >
                                {splitCamelCaseAndUp(CRD.current.spec.names.kind)}
                              </Typography.Text>
                            </Link>
                          </Tooltip>
                          <Tooltip title={'Open resource in modal'}>
                            <ArrowsAltOutlined style={{paddingLeft: 10}}
                                               onClick={() => setShowModal(true)}
                            />
                          </Tooltip>
                        </>
                      ) : (
                        <Typography.Text strong >
                          {splitCamelCaseAndUp(CRD.current.spec.names.kind)}
                        </Typography.Text>
                      )}
                    </div>
                  </Col>
                  {loading ? (
                    <Col span={14}>
                      <Input disabled size={'small'} />
                    </Col>
                  ) : (
                    <>
                      { onViewer ? (
                        <>
                          <Col span={13}>
                            <Input defaultValue={CR.current.metadata.name} value={CR.current.metadata.name} disabled={props.disabled} role={'textbox'}
                                   onChange={({ target }) => {if(!props.readonly) props.onChange(target.value)}}
                                   size={'small'}
                            />
                          </Col>
                          <Col span={1} style={{textAlign: 'center'}}>
                            {/*<Tooltip title={'Edit linked field'} placement={'top'}>*/}
                              <Button type={'primary'} icon={<LinkOutlined />}
                                      size={'small'}
                                      disabled
                                      onClick={() => {
                                        setonViewer(false);
                                      }}/>
                            {/*</Tooltip>*/}
                          </Col>
                        </>
                      ) : (
                        <Col span={14}>
                          <Select
                            allowClear
                            showSearch
                            size={'small'}
                            aria-label={'select'}
                            placeholder={'Select ' + CRD.current.spec.names.kind}
                            value={selectedCR}
                            style={{ width: '100%' }}
                            onChange={handleChangeCR}
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                            }
                          >
                            {CROptions.current}
                          </Select>
                        </Col>
                      )}
                    </>
                  )}
                </Row>
              </div>
              <div>
                { onViewer && !loading ? (
                  <Modal
                    destroyOnClose
                    title={CR.current.metadata.name}
                    visible={showModal}
                    footer={null}
                    onCancel={() => setShowModal(false)}
                  >
                    <div>
                      <FormViewer resource={CR.current} CRD={CRD.current} show={'spec'} />
                    </div>
                  </Modal>
                ) : null }
              </div>
            </div>
          ) : (
            !loading ? (
              NSs.current.length === 0 ? (
                <Row align="middle">
                  <Col span={24}>
                    <Alert message={'No resource ' + props.children.props.children[0].props.formData.kind + ' found.'}
                           type="warning" showIcon closable
                    />
                  </Col>
                </Row>
              ) : (
                <Row align="middle">
                  <Col span={24}>
                    <Alert message={'No resource ' + props.children.props.children[0].props.formData.kind +
                    ' found in namespace ' + selectedNS + '.'}
                           type="warning" showIcon closable
                    />
                  </Col>
                </Row>
              )
            ) : null
          )}
        </div>
      </div>
      ) : (
      <Alert message={'No resource of kind ' + props.label.split('/')[1].slice(0, -3) + ' found.'}
             description={'It is possible that you don\'t have the CRD installed' }
             type="error" showIcon
      />
    ))
}

export default ReferenceHandler;
