import { Button, Affix, Alert, Card, Input, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import ResourceHeader from './ResourceHeader';
import LoadingIndicator from '../../common/LoadingIndicator';
import Editor from '../../editors/Editor';
import ResourceForm from './ResourceForm';
import _ from 'lodash';
import { resourceNotifyEvent } from '../common/ResourceUtils';
import { useLocation, useParams } from 'react-router-dom';
import { CodeOutlined, InfoCircleOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { createNewConfig, getResourceConfig, updateResourceConfig } from '../common/DashboardConfigUtils';
import CustomTab from './CustomTab';
import { secondaryColor } from '../../services/Colors';

function ResourceGeneral(props){
  const [container, setContainer] = useState(null);
  const deleted = useRef(false)
  const [loading, setLoading] = useState(true);
  const [resource, setResource] = useState([]);
  const [resourceConfig, setResourceConfig] = useState({});
  const [currentTab, setCurrentTab] = useState('General');
  const [tabList, setTabList] = useState([])
  const [contentList, setContentList] = useState({});
  const [onEditTabTitle, setOnEditTabTitle] = useState('');
  const [onCustomResource, setOnCustomResource] = useState(false);
  let location = props._location ? props._location : useLocation();
  let params = props._params ? props._params : useParams();
  const changeTabFlag = useRef(true);

  useEffect(() => {
    loadResource();
    getDashConfig();
    window.api.DCArrayCallback.current.push(getDashConfig);
    setOnCustomResource(() => {
      if(params.resource && params.group){
        return window.api.getCRDFromName(params.resource + '.' + params.group);
      }
    })

    /** When unmounting, eliminate every callback and watch */
    return () => {
      window.api.DCArrayCallback.current = window.api.DCArrayCallback.current.filter(func => {
        return func !== getDashConfig;
      });
      window.api.abortWatch(params.resource);
    }
  }, [location])

  useEffect(() => {
    if(!loading && resource[0]){
      manageTabList();
      manageContentList();
    }
  }, [loading, resource, resourceConfig])

  useEffect(() => {
    if(onEditTabTitle !== ''){
      let index = tabList.indexOf(tabList.find(tab => tab.key === onEditTabTitle));
      const key = tabList[index].key;
      tabList[index] = {
        key: key,
        tab: (
          <div>
            <PlusOutlined/>
            <Input bordered={false} defaultValue={key} placeholder={key}
                   size={'small'}
                   role={'input'}
                   onPressEnter={(e) =>
                     updateConfigTabs(e.target.value, key)}
                   onBlur={(e) =>
                     updateConfigTabs(e.target.value, key)}
            />
          </div>
        )
      };
      setTabList([...tabList]);
    }
  }, [onEditTabTitle])

  const updateResource = (name, namespace, item) => {
    return window.api.updateGenericResource(location.pathname, item)
      .catch(() => {
        message.error('Could not update the resource');
      })
  }

  const deleteResource = () => {
    return window.api.deleteGenericResource(location.pathname);
  }

  const submit = item => {
    updateResource(item.metadata.name, item.metadata.namespace, item);
  }

  const getDashConfig = () => {
    setResourceConfig(() => {
      return getResourceConfig(params, location);
    });
  }

  const manageTabList = () => {
    let items = [
      {
        key: 'General',
        tab: (
          <span>
            <InfoCircleOutlined />General
          </span>
        )
      },
      {
        key: 'JSON',
        tab: (
          <span>
            <CodeOutlined />JSON
          </span>
        )
      }
    ]

    if(resourceConfig.render && resourceConfig.render.tabs){
      resourceConfig.render.tabs.forEach(tab => {
        items.push({
          key: tab.tabTitle,
          tab: (
            <span onDoubleClick={() => setOnEditTabTitle(tab.tabTitle)}>
              <PlusOutlined />{tab.tabTitle}
            </span>
          )
        })
      })
    }

    setTabList([...items]);
  }

  const manageContentList = () => {
    let items = {
      General: (
        <div>
          <ResourceForm resource={JSON.parse(JSON.stringify(resource[0]))}
                        updateFunc={updateResource} kind={resource[0].kind}
                        CRD={onCustomResource}
                        params={props._params ? params : null}
          />
        </div>
      ),
      JSON: (
        <div>
          <Editor value={JSON.stringify(resource[0], null, 2)}
                  onClick={submit}
          />
        </div>
      ),
    }

    if(resourceConfig.render && resourceConfig.render.tabs){
      resourceConfig.render.tabs.forEach(tab => {
        items[tab.tabTitle] = (
          <CustomTab content={tab.tabContent} resource={resource[0]} tabTitle={tab.tabTitle}
                     onCustomResource={onCustomResource} {...props}
          />
        )
      })
    }

    setContentList({...items});
  }

  const loadResource = () => {
    /** Get the resource */
    window.api.getGenericResource(!props.onCustomView ? location.pathname : props.pathname).then(
      res => {
        let resArray = [];
        resArray.push(res);
        setResource(resArray);
        /** Start a watch for this resource */
        if(!props.onCustomView)
          window.api.watchResource(
            location.pathname.split('/')[1],
            (params.group ? params.group : undefined),
            (params.namespace ? params.namespace : undefined),
            params.version,
            params.resource,
            params.resourceName,
            notifyEvent
          )
        setLoading(false);
      }
    ).catch(error => {
      console.log(error);
      deleted.current = true;
      setLoading(false);
    });
  }

  const updateConfigTabs = (name, prevValue) => {
    setOnEditTabTitle('');

    /** If nothing has changed, exit from the editing mode */
    if(name === prevValue){
      manageTabList();
      return;
    }

    let tempResourceConfig = resourceConfig;

    if(!_.isEmpty(tempResourceConfig)){

      if(!tempResourceConfig.render) tempResourceConfig.render = {};
      if(!tempResourceConfig.render.tabs) tempResourceConfig.render.tabs = [];

      /** If there is a tab render for this parameter, update it */
      let index = tempResourceConfig.render.tabs.indexOf(
        tempResourceConfig.render.tabs.find(tab =>
          tab.tabTitle === prevValue
        )
      );

      if(index !== -1){
        /** Delete tab if no name */
        if(name === '')
          delete tempResourceConfig.render.tabs[index];
        else
          tempResourceConfig.render.tabs[index].tabTitle = name;
      } else
        tempResourceConfig.render.tabs.push({
          tabTitle: name,
          tabContent: []
        })
    } else {
      tempResourceConfig = createNewConfig(params, {kind: resource[0].kind}, location);

      /** The resource doesn't have a config, create one */
      tempResourceConfig.render.tabs.push({
        tabTitle: name,
        tabContent: []
      })
    }

    updateResourceConfig(tempResourceConfig, params, location);

    if(name !== ''){
      setCurrentTab(name);
      changeTabFlag.current = false;
    }
  }

  const addTab = () => {
    const key = 'NewTab'
    const newPane = {
      key: key,
      tab: (
        <span>
          <PlusOutlined />{key}
        </span>
      )
    };
    setTabList(prev => [...prev, newPane]);
    setContentList(prev => {
      return {
        ...prev,
        [key]: (
          <CustomTab content={[]} resource={resource[0]} tabTitle={key}/>
        )
      }
    })
    setCurrentTab(key);
    updateConfigTabs(key);
  }

  const removeTab = (targetKey) => {
    setTabList(prev => {
      return prev.filter(tab => tab.key !== targetKey);
    });
    if(currentTab === targetKey)
      setCurrentTab('General');
    updateConfigTabs('', targetKey);
  }

  const onEditTab = (targetKey, action) => {
    if(action === 'add'){
      addTab();
    } else {
      removeTab(targetKey);
    }
  }

  const notifyEvent = (type, object) => {
    resourceNotifyEvent(setResource, type, object);
  }

  return(
    <div>
      <Alert.ErrorBoundary>
      {loading ? <LoadingIndicator /> : (
        resource[0] ? (
          <div aria-label={'crd'} key={resource[0].metadata.name} ref={setContainer}
               style={{height: props._params ? '80%' : '92vh', overflow: 'auto', marginLeft: -20, marginRight: -20, marginTop: -20}}
          >
            <div style={{marginLeft: 20, marginRight: 20}}>
              {!props.onRef ? (
                <div>
                  <Affix target={() => container}>
                    <ResourceHeader
                      onCustomResource={onCustomResource}
                      onCustomView={props.onCustomView}
                      resourceRedirect={'resources'}
                      resource={resource[0]}
                      name={resource[0].metadata.name}
                      kind={resource[0].kind}
                      deleted={deleted}
                      deleteFunc={deleteResource}
                      updateFunc={updateResource}
                    />
                  </Affix>
                </div> ) :
              null}
              <Card bodyStyle={{paddingTop: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: 0}}
                    headStyle={{marginLeft: -12, marginRight: -12}}
                    tabList={tabList}
                    tabProps={{
                      onEdit: onEditTab,
                      type: 'editable-card',
                      size: 'small',
                      animated: true
                    }}
                    size={'small'}
                    activeTabKey={currentTab}
                    onTabChange={key => {if(changeTabFlag.current) setCurrentTab(key); else changeTabFlag.current = true}}
                    style={{overflow: 'hidden'}}
                    bordered={false}
              >
                {contentList[currentTab]}
              </Card>
            </div>
          </div>
        ) : (
          <Alert
            message="Resource could not be found"
            description="The resource you are looking for is currently unavailable or could be deleted."
            type="warning"
            showIcon
          />
        )
      )}
      </Alert.ErrorBoundary>
    </div>
  )
}

export default ResourceGeneral;
