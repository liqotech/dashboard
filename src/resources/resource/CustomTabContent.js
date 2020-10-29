import { Alert, Row, Col, Button, Card, Input, Tooltip, Divider } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import FormViewer from '../../widgets/form/FormViewer';
import _ from 'lodash';
import './CustomTab.css'
import { useParams, useLocation } from 'react-router-dom';
import { CloseOutlined, SaveOutlined, LoadingOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import { getResourceConfig, updateResourceConfig } from '../common/DashboardConfigUtils';
import Utils from '../../services/Utils';
import TableViewer from '../../widgets/table/TableViewer';
import ResourceList from '../resourceList/ResourceList';
import { ResourceAutocomplete } from '../../common/ResourceAutocomplete';
import KubernetesSchemaAutocomplete from '../common/KubernetesSchemaAutocomplete';
import DraggableWrapper from '../../common/DraggableWrapper';

export default function CustomTab(props){
  const [deleting, setDeleting] = useState(false);
  const [editTabTitle, setEditTabTitle] = useState(false);
  const [cardTitle, setCardTitle] = useState(props.cardTitle);
  const [onContentEdit, setOnContentEdit] = useState(!(props.cardContent && props.cardContent.length !== 0));
  let location = props._location ? props._location : useLocation();
  let params = props._params ? props._params : useParams();

  const onDeleteContent = () => {
    setDeleting(true);
    props.onDeleteContent(props.cardTitle)
  }

  const updateTitle = (name) => {
    setEditTabTitle(false);

    let tempResourceConfig = getResourceConfig(params, location);
    tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle)
      .tabContent.find(item => item.cardTitle === cardTitle).cardTitle = name;
    updateResourceConfig(tempResourceConfig, params, location);

    setCardTitle(name);
  }

  const saveParameter = value => {
    let tempResourceConfig = getResourceConfig(params, location);
    addContent(value, tempResourceConfig);
  }

  const addContent = (value, tempResourceConfig) => {
    setOnContentEdit(false);
    tempResourceConfig = getResourceConfig(params, location);
    let cardContent = tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle)
      .tabContent.find(item => item.cardTitle === cardTitle).cardContent;

    if(!cardContent){
      cardContent = [];
    }

    cardContent.push({
      parameter: value
    });

    tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle)
      .tabContent.find(item => item.cardTitle === cardTitle).cardContent = cardContent;

    updateResourceConfig(tempResourceConfig, params, location);
  }

  const getParams = path => {
    let array = path.split('/');
    if (array[1] === 'apis') {
      return {
        group: array[2],
        version: array[3],
        namespace: params.namespace,
        resource: array[4]
      }
    } else {
      return {
        group: undefined,
        version: array[2],
        namespace: params.namespace,
        resource: array[3]
      }
    }
  }

  const deleteParameter = value => {
    let tempResourceConfig = getResourceConfig(params, location);
    tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle)
      .tabContent.find(item => item.cardTitle === cardTitle).cardContent =
      tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle)
        .tabContent.find(item => item.cardTitle === cardTitle).cardContent.filter(item =>
      item.parameter !== value
    );
    updateResourceConfig(tempResourceConfig, params, location);
  }

  let content = []
  let counter = 0;

  if(props.cardContent){
    props.cardContent.forEach(item => {
      let key = item.parameter;

      let parameter = Utils().index(props.resource, item.parameter);

      if(!parameter)
        parameter = 'None';

      let form = {
        [item.parameter]: parameter
      }

      if(form[item.parameter] && typeof form[item.parameter] !== 'object' && !Array.isArray(form[item.parameter])){
        form = {
          form: {
            [item.parameter.split('.').slice(-1)] : form[item.parameter]
          }
        }
        key = 'form';
      }

      content.push(
        <Row key={key + '_' + counter}
             align={props.cardDisplay === 'List' ? 'middle' : 'top'}
        >
          <Col span={onContentEdit ? 22 : 24}>
            {props.cardDisplay === 'List' ? (
              <FormViewer {...props}
                          resource={JSON.parse(JSON.stringify(form))} show={key}
                          readonly
              />
            ) : props.cardDisplay === 'Table' ? (
              <TableViewer form={form} title={key}/>
            ) : (
              <div style={{marginLeft: -13, marginRight: -13, marginTop: -12}}>
                <Alert.ErrorBoundary>
                  <ResourceList onRef={{
                                  filter: 'labels',
                                  filterValues: props.resource.metadata.labels
                                }}
                                _location={{
                                  pathname: item.parameter
                                }}
                                _params={getParams(item.parameter)}
                                key={'ref_' + item.parameter}
                  />
                </Alert.ErrorBoundary>
              </div>
            )}
          </Col>
          {onContentEdit ? (
            <Col style={{ textAlign: 'center' }} span={2}>
              <Button type={'danger'}
                      size={'small'}
                      icon={<DeleteOutlined/>}
                      onClick={() => deleteParameter(item.parameter)}
              />
            </Col>
          ) : null}
        </Row>
      )
      counter++;
    });
  }

  const onSearch = (value, option) => {
    if(option.value)
      saveParameter(option.value);
  }

  const getKind = () => {
    return _.capitalize(params.resource.slice(0, -1))
  }

  return(
    <div className={'scrollbar'}>
      <Card title={
              editTabTitle ? (
                <Input placeholder={cardTitle} size={'small'} autoFocus
                       defaultValue={cardTitle} role={'input'}
                       onBlur={(e) => {
                         updateTitle(e.target.value)
                       }}
                       onPressEnter={(e) => {
                         updateTitle(e.target.value)
                       }}
                       style={{width: '60%'}}
                /> ) : (
                <DraggableWrapper>
                  <div onClick={() => setEditTabTitle(true)}>
                    {cardTitle}
                  </div>
                </DraggableWrapper>
              )
            }
            size={'small'}
            type={'inner'}
            style={{overflowY: 'auto', height: '100%', overflowX: 'hidden', backgroundColor: '#fff'}}
            headStyle={{position: 'fixed', zIndex: 20, width: '100%'}}
            bodyStyle={{height: '100%', position: 'relative'}}
            extra={[
              <Tooltip title={'Edit Content'} key={'edit_content'}>
                <EditOutlined onClick={() => setOnContentEdit(prev => !prev)}
                              style={{marginRight: '1em'}}
                />
              </Tooltip>,
              <Tooltip title={'Delete Content'} key={'delete_content'}>
                {deleting ? <LoadingOutlined />
                : <CloseOutlined onClick={onDeleteContent} />}
              </Tooltip>
            ]}
            className={'scrollbar'}
      >
        <div style={{marginTop: 36, height: 'calc(100% - 36px)', position: 'relative'}}>
          {content && content.length !== 0 ? (
            <div>
              {content}
            </div>
          ) : (
            <div>
              <Alert
                closable
                message="Nothing to show here..."
                description="Try adding something."
                type="info"
                showIcon
              />
            </div>
          )}
          {onContentEdit ? (
            props.cardDisplay === 'Ref' ?
              (
                <ResourceAutocomplete onSearch={onSearch} style={{width: '100%', marginTop: 4}}/>
              ) : (
                <div style={{marginTop: 4}}>
                  <KubernetesSchemaAutocomplete kind={getKind()}
                                                onSearch={onSearch}
                                                single
                                                CRD={props.onCustomResource}
                  />
                </div>
              )
          ) : null}
        </div>
      </Card>
    </div>
  )
}
