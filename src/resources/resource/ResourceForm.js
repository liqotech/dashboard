import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';
import React, { useEffect, useState } from 'react';
import{  Input, Alert, Card } from 'antd';
import FormViewer from '../../widgets/form/FormViewer';
import { properCase } from '../../services/stringUtils';
import Logs from './pod/Logs';
import Utils from '../../services/Utils';
import _ from 'lodash';
import KubernetesSchemaAutocomplete from '../common/KubernetesSchemaAutocomplete';

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

  const searchProperty = (value, tab) => {
    let utils = Utils();
    let object = utils.getSelectedProperties(props.resource, value);

    if(_.isEmpty(object)) {
      tab = currentTab;
      object = props.resource[tab];
    }

    let searchedRes = {
      form: object
    }

    setContentList(prev => {
      prev[tab] = (
        <div key={tab + '_' + props.resource.metadata.name + '#' + value}>
          <Alert.ErrorBoundary>
            <div aria-label={'form_' + tab}>
              <FormViewer {...props} resource={JSON.parse(JSON.stringify(searchedRes))} show={'form'}
                          resourceName={props.resource.metadata.name} origResource={props.resource}
                          resourceNamespace={props.resource.metadata.namespace}
              />
            </div>
          </Alert.ErrorBoundary>
        </div>
      )
      return {...prev}
    })
    setCurrentTab(tab);
  };

  const onSearch = (value, option) => {
    searchProperty(option.label, option.value.split('.')[0])
  }

  return(
    <Card tabList={tabList}
          tabProps={{
            size: 'small',
          }}
          tabBarExtraContent={
            <div style={{width: '20em'}}>
              <KubernetesSchemaAutocomplete kind={props.kind}
                                            onSearch={onSearch}
                                            onClear={() => searchProperty('')} single
              />
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
