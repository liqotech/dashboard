import ToolOutlined from '@ant-design/icons/lib/icons/ToolOutlined';
import React, { useEffect, useState } from 'react';
import { Alert, Card } from 'antd';
import FormViewer from '../../editors/OAPIV3FormGenerator/FormViewer';
import { properCase } from '../../services/stringUtils';
import Logs from '../pod/Logs';

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
                  <FormViewer {...props} show={key} readonly={readonly}/>
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

  return(
    <Card tabList={tabList}
          tabProps={{
            size: 'small',
          }}
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
