import React, { useState } from 'react';
import './CR.css';
import {
  Badge, Card,
  Button,
  Drawer,
  message,
  Popconfirm, Alert,
  Tooltip, Typography, Collapse, Tag

} from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/lib/icons/ExclamationCircleOutlined';
import EditOutlined from '@ant-design/icons/lib/icons/EditOutlined';
import PieChart from '../templates/piechart/PieChart';
import HistoChart from '../templates/histogram/HistoChart';
import DeleteOutlined from '@ant-design/icons/lib/icons/DeleteOutlined';
import UpdateCR from '../editors/UpdateCR';
import { withRouter } from 'react-router-dom';
import FormViewer from '../editors/OAPIV3FormGenerator/FormViewer';
import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';

function CR(props) {

  const [showJSON, setShowJSON] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [currentTab, setCurrentTab] = useState('Spec');

  const onTabChange = (key) => {
    setCurrentTab(key);
  };

  /** Make the JSON visible or invisible */
  const handleClick_show = (event) => {
    event.stopPropagation();
    setShowJSON(!showJSON);
  }

  /** Delete the CR */
  const handleClick_delete = () => {
    let promise = window.api.deleteCustomResource(
      props.crd.spec.group,
      props.crd.spec.version,
      props.cr.metadata.namespace,
      props.crd.spec.names.plural,
      props.cr.metadata.name
    );

    promise
      .then(() => {
        message.success('Resource deleted');
      })
      .catch(() => {
        message.error('Could not delete the resource');
      });
  }

  /** If the CRD has a template, show it as the first option */
  const getChart = () => {
    return (
      <div className="rep-container">
        {props.template.kind === 'PieChart' ? (
          <div aria-label={'piechart'}>
            <PieChart CR={props.cr.spec} template={props.template} />
          </div>
        ) : null}
        {props.template.kind === 'HistoChart' ? (
          <div aria-label={'histochart'}>
            <HistoChart
              CR={props.cr.spec}
              template={props.template}
            />
          </div>
        ) : null}
      </div>
    );
  }

  let tabList = [];

  if(props.cr.metadata)
    tabList.push({
      key: 'Metadata',
      tab: <span>
             <ToolOutlined />
             Metadata
           </span>
    })

  if(props.cr.spec)
    tabList.push({
      key: 'Spec',
      tab: <span>
             <ToolOutlined />
             Spec
           </span>
    })

  if(props.cr.status)
    tabList.push({
      key: 'Status',
      tab: <span>
             <ToolOutlined />
             Status
           </span>
    })

  let contentList = {
    Metadata: props.cr.metadata ? (
      <div key={'metadata_' + props.cr.metadata.name}>
        <Alert.ErrorBoundary>
          <div aria-label={'form_metadata'}>
            <FormViewer CR={props.cr} CRD={props.crd} api={window.api} show={'metadata'} />
          </div>
        </Alert.ErrorBoundary>
      </div>
    ) : null,
    Spec: props.cr.spec ? (
      <div key={'spec_' + props.cr.metadata.name}>
        <Alert.ErrorBoundary>
          <div aria-label={'form_spec'}>
            <FormViewer CR={props.cr} CRD={props.crd} api={window.api} show={'spec'} />
          </div>
        </Alert.ErrorBoundary>
      </div>
    ) : null,
    Status: props.cr.status ? (
      <div key={'status_' + props.cr.metadata.name}>
        <Alert.ErrorBoundary>
          <div aria-label={'form_status'}>
            <FormViewer CR={props.cr} CRD={props.crd} show={'status'} api={window.api} />
          </div>
        </Alert.ErrorBoundary>
      </div>) : null,
  };

  return (
    <div aria-label={'cr'} style={{ marginBottom: 10 }}>
      <Collapse className={'crd-collapse'} style={{backgroundColor: '#fafafa'}}>
        <Collapse.Panel
          key={'collapse_' + props.cr.metadata.name}
          style={{ borderBottomColor: '#f0f0f0' }}
          header={<Typography.Text strong>{props.cr.metadata.name}</Typography.Text>}
          extra={
            <div onClick={(event) => {
              event.stopPropagation();
            }}>
              <Tooltip title={'Edit resource'}>
                <EditOutlined
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowUpdate(true)}
                  }
                  style={{ fontSize: 15, marginRight: 15, color: '#1890FF' }}
                />
              </Tooltip>
              <Drawer
                title={
                  <Badge status="processing"
                         text={"Update " + props.cr.metadata.name}
                  />
                }
                placement={'right'}
                visible={showUpdate}
                onClose={() => {setShowUpdate(false)}}
                width={window.innerWidth > 900 ? 700 : window.innerWidth - 200}
              >
                <UpdateCR CR={props.cr} CRD={props.crd}
                          group={props.crd.spec.group}
                          version={props.crd.spec.version}
                          plural={props.crd.spec.names.plural}
                          setShowUpdate={setShowUpdate}
                          api={window.api}
                />
              </Drawer>
              <Tooltip title={'Show JSON'}>
                <Button size={'small'}
                        onClick={(event) => handleClick_show(event)}
                        style={ !showJSON ?
                          { marginRight: 15 } : { marginRight: 15, color: '#1890FF' }}
                >
                  JSON
                </Button>
              </Tooltip>
              <Tooltip title={'Delete resource'} placement={'bottomRight'}>
                <Popconfirm
                  placement="topRight"
                  title="Are you sure?"
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }}/>}
                  onConfirm={handleClick_delete}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button size={'small'}
                          type="primary" danger icon={<DeleteOutlined />}
                          onClick={event => {
                            event.stopPropagation();
                          }}
                  />
                </Popconfirm>
              </Tooltip>
            </div>
          }
        >
          <div>
            {showJSON ? (
              <div>
                <div aria-label={'json'}>
                  {props.cr.spec ? (
                    <Tag style={{width: '100%', fontSize: '1em'}}>
                      <pre>{JSON.stringify(props.cr.spec, null, 2)}</pre>
                    </Tag>) : null}
                  {props.cr.status ? (
                    <Tag style={{width: '100%', fontSize: '1em'}}>
                      <pre>{JSON.stringify(props.cr.status, null, 2)}</pre>
                    </Tag>) : null}
                </div>
              </div>
            ) : null}
            {!showJSON && props.template
              ? getChart()
              : null}
            {!showJSON && !props.template ? (
              <Card tabList={tabList}
                    tabProps={{
                      size: 'small'
                    }}
                    size={'small'}
                    type={'inner'}
                    activeTabKey={currentTab}
                    onTabChange={key => {onTabChange(key)}}
                    style={{overflow: 'hidden'}}
              >
                {contentList[currentTab]}
              </Card>
            ) : null}
          </div>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
}

export default withRouter(CR);
