import {ToolOutlined} from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import{  Input, Alert, Card } from 'antd';
import FormViewer from '../../widgets/form/FormViewer';
import { properCase, splitCamelCaseAndUp } from '../../services/stringUtils';
import Logs from './pod/Logs';
import Utils from '../../services/Utils';
import _ from 'lodash';
import KubernetesSchemaAutocomplete from '../common/KubernetesSchemaAutocomplete';

export default function ResourceForm(props){
  const [currentTab, setCurrentTab] = useState(props.currentTab ? props.currentTab : 'metadata');
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
                {splitCamelCaseAndUp(key)}
               </span>
        }])

        setContentList(prev => {
          let readonly = (key === 'metadata' || key === 'status' || props.readonly)
          return {...prev,
            [key]: (<div key={key + '_' + props.resourceName ? props.resourceName : props.resource.metadata.name}>
              <Alert.ErrorBoundary>
                <div aria-label={'form_' + key}>
                  <FormViewer {...props} show={key} readonly={readonly}
                              resourceName={props.resourceName ? props.resourceName : props.resource.metadata.name}
                              resourceNamespace={props.resourceNamespace ? props.resourceNamespace :
                                props.resource.metadata ? props.resource.metadata.namespace : null
                              }
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
          logs: (<div key={'logs_' + props.resourceName ? props.resourceName : props.resource.metadata.name}>
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
        <div key={tab + '_' + props.resourceName ? props.resourceName : props.resource.metadata.name + '#' + value}>
          <Alert.ErrorBoundary>
            <div aria-label={'form_' + tab}>
              <FormViewer {...props} resource={JSON.parse(JSON.stringify(searchedRes))} show={'form'}
                          resourceName={props.resourceName ? props.resourceName : props.resource.metadata.name}
                          origResource={props.origResource ? props.origResource : props.resource}
                          resourceNamespace={props.resourceNamespace ? props.resourceNamespace :
                            props.resource.metadata ? props.resource.metadata.namespace : null
                          }
                          onDotNotation
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
            !props.noSearch ? (
              <div style={{width: '20em'}}>
                <KubernetesSchemaAutocomplete kind={props.kind}
                                              onSearch={onSearch}
                                              onClear={() => searchProperty('')} single
                                              {...props}
                />
              </div>
            ) : null
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
