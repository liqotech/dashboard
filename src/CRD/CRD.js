import React, { useEffect, useRef, useState } from 'react';
import './CRD.css';
import './CRDList.css';
import {
  Space, Alert,
  Badge, Button, Layout, Dropdown,
  message, Tag, Typography, Tooltip,
  Descriptions, Switch, Pagination, Empty, Rate, Drawer, Card, Divider
} from 'antd';
import CR from './CR';
import { Link } from 'react-router-dom';
import LoadingIndicator from '../common/LoadingIndicator';
import GraphNet from '../templates/graph/GraphNet';
import Utils from '../services/Utils';
import PlusOutlined from '@ant-design/icons/lib/icons/PlusOutlined';
import PictureOutlined from '@ant-design/icons/lib/icons/PictureOutlined';
import DragOutlined from '@ant-design/icons/lib/icons/DragOutlined';
import PushpinOutlined from '@ant-design/icons/lib/icons/PushpinOutlined';
import LayoutOutlined from '@ant-design/icons/lib/icons/LayoutOutlined';
import { Menu } from 'antd';
import NewCR from '../editors/NewCR';
import DesignEditorCRD from '../editors/DesignEditorCRD';
import AddCustomView from '../views/AddCustomView';

function CRD(props) {

  /**
   * @param loading: boolean
   * @param CRD: the CRD we are viewing
   * @param customResources: CRs of this CRD (if there are any)
   * @param template: CR of the template (if there is a template selected for this CRD)
   * @param isDraggable: if on a custom view, if the component is allowed to be dragged around
   * @param isPinned: if on a custom view, if the component is set static
   * @param CRShown: actual custom resources shown in the page
   * @param multi: if the template is a cluster of more custom resources
   * @param customViews: if we are on a custom view, it's the one
   * @param showCreate: boolean to display "create" drawer
   * @param showEditor: boolean to display "editor" drawer
   */

  const [loading, setLoading] = useState(true);
  const [CRD, setCRD] = useState(() => {
    /** In case we are not on a custom view */
    if(!props.onCustomView){
      /** Get the CRD */
      return window.api.getCRDFromName(props.match.params.crdName);
    }
    /** In case we are in a custom view */
    else {
      return window.api.getCRDFromName(props.CRD);
    }
  });
  const currentPageSizeChange = useRef(0);
  const pageSize = useRef(5);
  const currentPage = useRef(1);
  const [customResources, setCustomResources] = useState([]);
  const [template, setTemplate] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [CRShown, setCRShown] = useState([]);
  let [customViews, setCustomViews] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showResources, setShowResources] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  let [tempTemplate, setTempTemplate] = useState(null);
  let multi = false;

  useEffect(() => {
    window.api.CRDArrayCallback.current.push(reloadCRD);
    tempTemplate = null;

    /** In case we are not on a custom view */
    if(!props.onCustomView){
      /** Set a callback to keep track of custom view's update */
      window.api.CVArrayCallback.current.push(getCustomViews);
      /** Get the custom views */
      customViews = window.api.customViews.current;
      /** Get the CRD */
      setCRD(window.api.getCRDFromName(props.match.params.crdName));
    }
    /** In case we are in a custom view */
    else {
      setCRD(window.api.getCRDFromName(props.CRD));
    }

    /** When unmounting, eliminate every callback and watch */
    return () => {
      window.api.CRDArrayCallback.current = window.api.CRDArrayCallback.current.filter(func => {return func !== reloadCRD});
      if(!props.onCustomView){
        window.api.abortWatch(props.match.params.crdName.split('.')[0]);
        window.api.CVArrayCallback.current = window.api.CVArrayCallback.current.filter(func => {return func !== getCustomViews});
      } else {
        window.api.abortWatch(CRD.spec.names.plural);
      }
    }
  }, [props.match])

  useEffect(() => {
    setCRShown(customResources.slice(0, pageSize.current));
  }, [customResources])

  useEffect(() => {
    loadCustomResources();
  }, [CRD])

  /** Update state if a CRD is loaded or changed */
  const reloadCRD = CRDs => {
    let _CRD;

    if(CRDs){
      if(props.onCustomView){
        _CRD = CRDs.find(item => {
          return item.metadata.name === props.CRD;
        });
      } else {
        _CRD = CRDs.find(item => {
          return item.metadata.name === props.match.params.crdName;
        });
      }
      setCRD(_CRD);
      /** See if there is a template for the CRD */
      findTemplate(_CRD);
    }
  }

  /** Update the custom views */
  const getCustomViews = () => {
    setCustomViews([...window.api.customViews.current]);
  }

  const loadCustomResources = () => {
    /** First get all the CR */
    window.api.getCustomResourcesAllNamespaces(CRD)
      .then((res) => {
          setCustomResources(res.body.items);
          setLoading(false);

          /** Then set up a watch to watch changes in the CR of the CRD */
          window.api.watchCRD(
            CRD.spec.group,
            CRD.spec.version,
            CRD.spec.names.plural,
            CRNotifyEvent
          );

          /** See if there is a template for the CRD */
          findTemplate(CRD);
        }
      ).catch(error => console.log(error));
  }

  /** Update CRD with the 'favourite' annotation */
  const handleClick_fav = async () => {
    if(!CRD.metadata.annotations || !CRD.metadata.annotations.favourite){
      CRD.metadata.annotations = {favourite: 'true'};
    } else {
      CRD.metadata.annotations.favourite = null;
    }
    await window.api.updateCustomResourceDefinition(
      CRD.metadata.name,
      CRD
    )
  }

  /** check if this CRD is already in a custom view */
  const checkAlreadyInView = (e) => {
    let cv = window.api.customViews.current.find(item => {
      return item.metadata.name === e;
    });

    if(cv.spec.crds){
      return !!cv.spec.crds.find(item => {
        if(item)
          return item.crdName === CRD.metadata.name;
      });
    }
  }

  /** Update the custom view CR and include this CRD */
  const handleClick_addToView = (e) => {
    let cv = window.api.customViews.current.find(item => {
      return item.metadata.name === e.key;
    });
    let index = -1;

    /** Search if the CRD is in the view */
    index = cv.spec.crds.indexOf(
      cv.spec.crds.find(item => {
        if(item)
          return item.crdName === CRD.metadata.name;
      }));

    /** If the CRD is in the view, remove it
     *  or else, add it in the view
     */
    if(index !== -1){
      cv.spec.crds[index] = null;
    } else {
      cv.spec.crds.push({
        crdName: CRD.metadata.name
      });
    }

    let array = cv.metadata.selfLink.split('/');
    let promise = window.api.updateCustomResource(
      array[2],
      array[3],
      array[5],
      array[6],
      array[7],
      cv
    );

    promise
      .then(() => {
        message.success('Resource updated');
      })
      .catch((error) => {
        console.log(error)
        message.error('Could not update the resource');
      });
  }

  const editDescription = async (value) => {
    CRD.metadata.annotations.description = value;

    await window.api.updateCustomResourceDefinition(
      CRD.metadata.name,
      CRD
    )
  }

  const header = () => {
    const items = [];

    window.api.customViews.current.forEach(item => {
      items.push(
        <Menu.Item key={item.metadata.name} onClick={handleClick_addToView}>
          {
            item.spec.viewName ? (
              <span style={checkAlreadyInView(item.metadata.name) ? {
                color: 'red'
              } : null}>{ item.spec.viewName }</span>
            ) : (
              <span style={checkAlreadyInView(item.metadata.name) ? {
                color: 'red'
              } : null}>{ item.metadata.name }</span>
            )
          }
        </Menu.Item>
      )
    });

    if(items.length === 0){
      items.push(
        <Menu.Item key={'no-item'}>No custom views</Menu.Item>
      )
    }

    const menu = (
      <Menu>
        {items}
        <Menu.Item key="addCV" >
          <AddCustomView selected={CRD.metadata.name} />
        </Menu.Item>
      </Menu>
    )

    return (
      <div>
        <div>
          <Badge color='#1890FF' text={<Link to={{
            pathname: '/customresources/' + CRD.metadata.name,
            state: {
              CRD: CRD
            }
          }} >
            <Tooltip title={CRD.metadata.name} placement={'top'}>
              <Typography.Text strong style={{fontSize: 20}}>
                {props.altName ? props.altName
                  : CRD.spec.names.kind}
              </Typography.Text>
            </Tooltip>
          </Link>} />
          <Rate className="crd-fav" count={1}
                value={
                  CRD.metadata.annotations &&
                  CRD.metadata.annotations.favourite ? 1 : 0
                }
                onChange={handleClick_fav}
                style={{marginLeft: 10}}
          />
          {
            !props.onCustomView ? (
              <div style={{float: "right"}}>
                <Space align={'center'}>
                  <Tooltip title={'Add or Remove to View'} placement={'topLeft'}>
                    <Dropdown.Button overlay={menu} placement="bottomCenter"
                                     style={{paddingTop: 6}}
                                     trigger={['click']} icon={<LayoutOutlined />} />
                  </Tooltip>
                  <Tooltip title={'Edit design'} placement={'top'}>
                    <Button icon={<PictureOutlined />} type="primary"
                            onClick={() => {setShowEditor(true)}}/>
                  </Tooltip>
                  <Tooltip title={'Create new resource'} placement={'topRight'}>
                    <Button icon={<PlusOutlined />} type="primary"
                            onClick={() => {setShowCreate(true)}} />
                  </Tooltip>
                </Space>
                <DesignEditorCRD CRD={CRD}
                                 setShowEditor={setShowEditor}
                                 CR={customResources} showEditor={showEditor}
                />
                <Drawer
                  title={
                    <Badge status="processing"
                           text={"Create a new " + CRD.spec.names.kind + " resource"}
                    />
                  }
                  placement={'right'}
                  visible={showCreate}
                  onClose={() => {setShowCreate(false)}}
                  width={window.innerWidth > 900 ? 700 : window.innerWidth - 200}
                  destroyOnClose
                >
                  <NewCR CRD={CRD} setShowCreate={setShowCreate} />
                </Drawer>
              </div>
            ) : (
              <div style={{float: 'right'}}>
                <Tooltip title={'Pin'} placement={'top'}>
                  <PushpinOutlined style={isPinned ?
                    {
                      fontSize: '20px',
                      marginRight: 10,
                      marginLeft: 30,
                      color: '#1890FF'
                    }:{
                      fontSize: '20px',
                      marginRight: 10,
                      marginLeft: 30
                    }}
                                   onClick={() => {
                                     setIsPinned(!isPinned);
                                     props.func(CRD.metadata.name);
                                   }}
                  />
                </Tooltip>
                <Tooltip title={'Drag'} placement={'top'}>
                  <DragOutlined className={'draggable'}
                                style={{
                                  fontSize: '20px',
                                  marginLeft: 20
                                }}
                  />
                </Tooltip>
              </div>
            )
          }
        </div>
        <Space align={'center'}>
          <Descriptions style={{marginTop: 15, marginLeft: 15}}>
            <Descriptions.Item>
              <Typography.Paragraph editable={{ onChange: editDescription }} type={'secondary'} style={{marginBottom: 0}}>
              {CRD.metadata.annotations && CRD.metadata.annotations.description ?
                CRD.metadata.annotations.description :
                'No description for this CRD'
              }
              </Typography.Paragraph >
            </Descriptions.Item>
          </Descriptions>
          {
            (template || tempTemplate) ? (
              <div style={{float: 'right'}}>
                <Tooltip placement="left" title="Change CR design">
                  <Switch defaultChecked onChange={changeTemplate}/>
                </Tooltip>
              </div>
            ) : null
          }
        </Space>
      </div>
    )
  }

  /**
   * Callback for CRD watcher trigger (if a CR is changed/added/modified)
   * @param type: description of the trigger (modify/add/delete)
   * @param object: object modified/added/deleted
   */
  const CRNotifyEvent = (type, object) => {

    setCustomResources(prev => {
      let CR = prev.find((item) => {
        return item.metadata.name === object.metadata.name;
      });

      if ((type === 'ADDED' || type === 'MODIFIED')) {
        // Object creation succeeded
        if(CR) {
          if(CR.metadata.resourceVersion !== object.metadata.resourceVersion){
            prev = prev.filter(item => item.metadata.name !== object.metadata.name);
            prev.push(object);
            message.success('Resource ' + object.metadata.name + ' modified');
            return [...prev];
          }
        } else {
          prev.push(object);
          message.success('Resource ' + object.metadata.name + ' added');
          return [...prev];
        }
      } else if (type === 'DELETED') {
        if(CR){
          prev = prev.filter(item => item.metadata.name !== CR.metadata.name);
          message.success('Resource ' + object.metadata.name + ' deleted');
          return [...prev];
        }
      }

      return prev;
    });
  }

  /**
   * Function that get the CR template for the current CRD
   * @param _CRD: this CRD
   */
  const findTemplate = _CRD => {
    if ((_CRD.metadata.annotations && _CRD.metadata.annotations.template) || props.altTemplate) {
      let CR = null;
      let array = [];
      if(props.altTemplate){
        array = props.altTemplate.split('/');
      }else{
        array = _CRD.metadata.annotations.template.split('/');
      }

      window.api.getCustomResourcesAllNamespaces({
        spec: {
          group: array[0],
          version: array[1],
          names: { plural: array[2] }
        }
      }).then(res => {
        CR = res.body.items.find(item => {
          return item.metadata.name === array[3];
        });

        setTemplate(CR);
      }).catch(error => console.log(error))
    } else {
      setTemplate(null);
    }
  };

  /** Change from custom template to default */
  const changeTemplate = checked => {
    if(!checked){
      setTempTemplate(template);
      setTemplate(null);
    } else {
      setTemplate(tempTemplate);
      tempTemplate = null;
    }
  };

  /** When going to another page, change the CRDs shown */
  const paginationChange = (current, size) => {
    if(currentPageSizeChange.current !== 0){
      current = currentPageSizeChange.current;
      currentPageSizeChange.current = 0;
    }
    currentPage.current = current;
    setCRShown(customResources.slice(size*(current-1), size*current));
  }

  const paginationSizeChange = (current, size) => {
    if(size > pageSize.current)
      currentPageSizeChange.current = Math.ceil((pageSize.current*current)/size);
    else currentPageSizeChange.current = Math.floor(((pageSize.current*(current-1))/size) + 1);
    pageSize.current = size;
  }

  if(loading || !CRD){
    return (
      <div>
        <LoadingIndicator style={{marginTop: 100}} />
      </div>
    );
  }

  const utils = Utils();
  let schema = null;
  if(CRD.spec.validation)
    schema = utils.OAPIV3toJSONSchema(CRD.spec.validation.openAPIV3Schema);

  /** array of CR components */
  const CRViews = [];

  /** temp solution for graphs (in general for multi-item designs) */
  if(template && template.kind === 'Graph'){
    multi = true;
    CRViews.push(
      <GraphNet key={'0'}
                customResources={customResources}
                template={template} CRD={CRD}
      />
    )
  } else {
    multi = false;

    CRShown.forEach(item => {
      CRViews.push(
        /**
         * @param api: this apiManager instance
         * @param cr: one of the CRD custom resource
         * @param crd: this CRD
         * @param func: callback for CR deletion (needs to be performed in this component because of the watcher)
         * @param template: CR of the template design for this CRD CRs
         */
        <CR key={item.metadata.namespace + '/' + item.metadata.name}
            cr={item}
            crd={CRD}
            template={template}
        />
      );
    })
    if(CRViews.length === 0) {
      CRViews.push(
        <Empty key={'empty_res'} description={<strong>No resources present</strong>}/>
      )
    }
  }

  /**
   * Maybe show something else not annotations idk
   * for now it shows annotations
   */
  const CRD_annotations = [];
  if(CRD.metadata.annotations){
    for(let annotation of Object.entries(CRD.metadata.annotations)) {
      CRD_annotations.push(
        <Tag key={annotation} style={{maxWidth: '100%'}} aria-label={'tag'}>
          <pre>{JSON.stringify(annotation, null, 2)}</pre>
        </Tag>
      );
    }
  }

  const content = (
    <div>
      <div>
        <div className="crd-header">
          <Layout style={{background: '#fff'}}>
            {header()}
          </Layout>
          <Layout style={{background: '#fff'}}>
            <Layout.Content>
              { props.onCustomView ? (
                <div>
                  <Divider style={{marginTop: 0, marginBottom: 15}}/>
                  {CRViews}
                  { !multi && customResources.length > 5 ? (
                    <div className="no-crds-found" aria-label={'pagination'}>
                      <Pagination defaultCurrent={1} total={customResources.length}
                                  defaultPageSize={pageSize.current}
                                  current={currentPage.current}
                                  onChange={paginationChange}
                                  showSizeChanger={true} onShowSizeChange={paginationSizeChange}
                                  pageSizeOptions={[5, 10, 20, 50, 100]}
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div>
                  <Divider style={{marginTop: 0, marginBottom: 15, marginLeft: '-100px', marginRight: '-100px', width: '100vw'}}/>
                  { showAnnotations ? (
                    CRD_annotations.length > 0 ? (
                      <div>{CRD_annotations}</div>
                    ) : (
                      <Empty key={'empty_ann'} description={<strong>No annotations</strong>}/>
                    )
                  ) : null}
                  { showResources ? (
                    <>
                      {CRViews}
                      { !multi && customResources.length > 5 ? (
                        <div className="no-crds-found" aria-label={'pagination'}>
                          <Pagination defaultCurrent={1} total={customResources.length}
                                      defaultPageSize={pageSize.current}
                                      current={currentPage.current}
                                      onChange={paginationChange}
                                      showSizeChanger={true} onShowSizeChange={paginationSizeChange}
                                      pageSizeOptions={[5, 10, 20, 50, 100]}
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {/** Show the JSON Schema of the CRD */}
                  { showSchema ? (
                    schema ? (
                      <Tag style={{width: '100%', fontSize: '1.1em'}}>
                        <pre aria-label={'schema'}>{JSON.stringify(schema.properties.spec, null, 2)}</pre>
                      </Tag>
                    ) : (
                      <Empty key={'empty_schema'} description={<strong>No schema for this CRD</strong>}/>
                    )
                  ) : null}
                </div>
              )}
            </Layout.Content>
          </Layout>
        </div>
      </div>
    </div>
  )

  return (
    <Alert.ErrorBoundary>
      <div aria-label={'crd'} key={CRD.metadata.name}>
        {!props.onCustomView ? (
          <Card className={'crd-container'}
                style={{margin: 'auto'}}
                actions={[
                  <div onClick={() => {
                    setShowAnnotations(true);
                    setShowResources(false);
                    setShowSchema(false);
                  }}>
                    <Typography.Text strong>Annotations</Typography.Text>
                  </div>
                  ,
                  <div onClick={() => {
                    setShowAnnotations(false);
                    setShowResources(true);
                    setShowSchema(false);
                  }}>
                    <Typography.Text strong>Resources</Typography.Text>
                  </div>,
                  <div onClick={() => {
                    setShowAnnotations(false);
                    setShowResources(false);
                    setShowSchema(true);
                  }}>
                    <Typography.Text strong>Schema</Typography.Text>
                  </div>
                ]}
          >
            {content}
          </Card>
        ) : (
          <div>
            {content}
          </div>
        )}
      </div>
    </Alert.ErrorBoundary>
  );
}

export default CRD;
