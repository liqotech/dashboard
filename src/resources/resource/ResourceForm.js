import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';
import React, { useEffect, useState } from 'react';
import{  Input, Alert, Card } from 'antd';
import FormViewer from '../../editors/OAPIV3FormGenerator/FormViewer';
import { properCase } from '../../services/stringUtils';
import Logs from './pod/Logs';
import Utils from '../../services/Utils';
import _ from 'lodash';

export default function ResourceForm(props){
  const [currentTab, setCurrentTab] = useState('metadata');
  const [tabList, setTabList] = useState([]);
  const [contentList, setContentList] = useState({});

  const onTabChange = (key) => {
    setCurrentTab(key);
  };

  useEffect(() => {
    setTabList([]);
    setContentList([]);
    Object.keys(props.resource).forEach(key => {
      if(typeof props.resource[key] === 'object' && props.resource[key] !== null){
        setTabList(prev => [...prev, {
          key: key,
          tab: <span>
                <ToolOutlined />
                {properCase(key)}
               </span>
        }])

        setContentList(prev => {
          let readonly = (key === 'metadata' || key === 'status')
          return {...prev,
            [key]: (<div key={key + '_' + props.resource.metadata.name}>
              <Alert.ErrorBoundary>
                <div aria-label={'form_' + key}>
                  <FormViewer {...props} show={key} readonly={readonly}
                              resourceName={props.resource.metadata.name}
                              resourceNamespace={props.resource.metadata.namespace}
                  />
                </div>
              </Alert.ErrorBoundary>
            </div>)
          }})
      }
    });

    if(props.kind === 'Pod'){
      setTabList(prev => [...prev, {
        key: 'logs',
        tab: <span>
              <ToolOutlined />
              {properCase('logs')}
             </span>
      }])

      setContentList(prev => {
        return {...prev,
          logs: (<div key={'logs_' + props.resource.metadata.name}>
            <Alert.ErrorBoundary>
              <Logs {...props} />
            </Alert.ErrorBoundary>
          </div>)
        }})
    }
  }, [props.resource])

  const searchProperty = value => {
    let utils = Utils();
    let object = utils.getSelectedProperties(props.resource[currentTab], value.target.value);

    if(_.isEmpty(object))
      object = props.resource[currentTab];

    let searchedRes = {
      [currentTab]: object
    }

    setContentList(prev => {
      prev[currentTab] = (
        <div key={currentTab + '_' + props.resource.metadata.name + '#' + value.target.value}>
          <Alert.ErrorBoundary>
            <div aria-label={'form_' + currentTab}>
              <FormViewer {...props} resource={JSON.parse(JSON.stringify(searchedRes))} show={currentTab}
                          resourceName={props.resource.metadata.name} origResource={props.resource[currentTab]}
                          resourceNamespace={props.resource.metadata.namespace}
              />
            </div>
          </Alert.ErrorBoundary>
        </div>
      )
      return {...prev}
    })
  };

  return(
    <Card tabList={tabList}
          tabProps={{
            size: 'small',
          }}
          tabBarExtraContent={
            <div style={{width: '20em'}}>
              <Input size={'small'} onPressEnter={searchProperty} placeholder={'Search'} allowClear />
            </div>
          }
          size={'small'}
          type={'inner'}
          activeTabKey={currentTab}
          onTabChange={key => {onTabChange(key)}}
          style={{overflow: 'hidden', minHeight: '72vh'}}
    >
      {contentList[currentTab]}
    </Card>
  )
}
