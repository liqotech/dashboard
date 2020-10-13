import React, { useState } from 'react';
import './CR.css';
import {
  Button,
  message,
  Popconfirm,
  Tooltip, Typography, Collapse, Tag

} from 'antd';
import ExclamationCircleOutlined from '@ant-design/icons/lib/icons/ExclamationCircleOutlined';
import EditOutlined from '@ant-design/icons/lib/icons/EditOutlined';
import PieChart from '../../templates/piechart/PieChart';
import HistoChart from '../../templates/histogram/HistoChart';
import DeleteOutlined from '@ant-design/icons/lib/icons/DeleteOutlined';
import UpdateCR from '../../editors/CRD/UpdateCR';
import { withRouter } from 'react-router-dom';
import ResourceForm from '../resource/ResourceForm';

function CR(props) {

  const [showJSON, setShowJSON] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

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
                <UpdateCR CR={props.cr} CRD={props.crd}
                          setShowUpdate={setShowUpdate}
                          showUpdate={showUpdate}
                />
              </Tooltip>
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
              <ResourceForm resource={props.cr} CRD={props.crd} />
            ) : null}
          </div>
        </Collapse.Panel>
      </Collapse>
    </div>
  );
}

export default withRouter(CR);
