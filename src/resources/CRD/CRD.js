import React, { useEffect, useRef, useState } from 'react';
import './CRD.css';
import './CRDList.css';
import _ from 'lodash';
import {
  Space, Alert,
  Badge, Button, Layout,
  message, Tag, Typography, Tooltip,
  Descriptions, Switch, Pagination, Empty, Rate, Drawer, Card, Divider
} from 'antd';
import CR from './CR';
import { Link, useParams, useLocation } from 'react-router-dom';
import LoadingIndicator from '../../common/LoadingIndicator';
import GraphNet from '../../templates/graph/GraphNet';
import Utils from '../../services/Utils';
import PlusOutlined from '@ant-design/icons/lib/icons/PlusOutlined';
import PictureOutlined from '@ant-design/icons/lib/icons/PictureOutlined';
import DragOutlined from '@ant-design/icons/lib/icons/DragOutlined';
import PushpinOutlined from '@ant-design/icons/lib/icons/PushpinOutlined';
import NewResource from '../../editors/CRD/NewResource';
import DesignEditorCRD from '../../editors/CRD/DesignEditorCRD';
import Editor from '../../editors/Editor';
import CustomViewButton from '../common/buttons/CustomViewButton';
import { resourceNotifyEvent } from '../common/ResourceUtils';

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
  const [CRD, setCRD] = useState({});
  const currentPageSizeChange = useRef(0);
  const pageSize = useRef(5);
  const currentPage = useRef(1);
  const [customResources, setCustomResources] = useState([]);
  const [template, setTemplate] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [CRShown, setCRShown] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showResources, setShowResources] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  let [tempTemplate, setTempTemplate] = useState(null);
  let multi = false;

  let params = useParams();
  let location = useLocation();

  useEffect(() => {
    window.api.CRDArrayCallback.current.push(reloadCRD);
    window.api.NSArrayCallback.current.push(loadCustomResources);
    tempTemplate = null;
    let _CRD;

    /** In case we are not on a custom view */
    if(!props.onCustomView){
      /** Get the CRD */
      _CRD = window.api.getCRDFromName(params.crdName);
      setCRD(_CRD);
    }
    /** In case we are in a custom view */
    else {
      _CRD = window.api.getCRDFromName(props.CRD);
      setCRD(_CRD);
    }

    /** When unmounting, eliminate every callback and watch */
    return () => {
      setCRD({});
      window.api.CRDArrayCallback.current = window.api.CRDArrayCallback.current.filter(func => {return func !== reloadCRD});
      window.api.NSArrayCallback.current = window.api.NSArrayCallback.current.filter(func => {return func !== loadCustomResources});
      if(!props.onCustomView){
        window.api.abortWatch(params.crdName.split('.')[0]);
      } else {
        window.api.abortWatch(_CRD.spec.names.plural);
      }
    }
  }, [location.pathname])

  useEffect(() => {
    setCRShown(customResources.slice(0, pageSize.current));
  }, [customResources])

  useEffect(() => {
    if(!_.isEmpty(CRD))
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
          return item.metadata.name === params.crdName;
        });
      }
      setCRD(_CRD);
      /** See if there is a template for the CRD */
      findTemplate(_CRD);
    }
  }

  const loadCustomResources = () => {
    setCRD(prev => {
      /** First get all the CR */
      window.api.getCustomResourcesAllNamespaces(prev)
        .then((res) => {
            setCustomResources(res.body.items);
            setLoading(false);
  
            /** Then set up a watch to watch changes in the CR of the prev */
            window.api.watchResource(
              'apis',
              prev.spec.group,
              undefined,
              prev.spec.version,
              prev.spec.names.plural,
              undefined,
              CRNotifyEvent
            );
  
            /** See if there is a template for the prev */
            findTemplate(prev);
          }
        ).catch(error => console.log(error));
      return prev
    })
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

  const editDescription = async (value) => {
    CRD.metadata.annotations.description = value;

    await window.api.updateCustomResourceDefinition(
      CRD.metadata.name,
      CRD
    )
  }

  const header = () => {
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
                  <CustomViewButton resource={CRD} />
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
                <NewResource resource={CRD}
                             showCreate={showCreate}
                             setShowCreate={setShowCreate}
                             kind={CRD.spec.names.kind}
                />
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
    resourceNotifyEvent(setCustomResources, type, object);
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
        <Empty key={'empty_res'} description={<Typography.Text type={'secondary'}>No resources present</Typography.Text>}/>
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
                      <Empty key={'empty_ann'} description={<Typography.Text type={'secondary'}>No annotations</Typography.Text>}/>
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
                      <div aria-label={'schema'}>
                        <Editor value={JSON.stringify(schema.properties.spec, null, 2)} />
                      </div>
                    ) : (
                      <Empty key={'empty_schema'} description={<Typography.Text type={'secondary'}>No schema for this CRD</Typography.Text>}/>
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
