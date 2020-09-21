import React, { Component } from 'react';
import './CRD.css';
import './CRDList.css';
import {
  Space,
  Badge, Button, Layout, Dropdown,
  notification, Tag, Typography, Tooltip,
  Descriptions, Switch, Pagination, Empty, Rate, Drawer, Card, Divider
} from 'antd';
import CR from './CR';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
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

class CRD extends Component {
  constructor(props) {
    super(props);
    this.CRnotifyEvent = this.CRnotifyEvent.bind(this);

    /**
     * @param isLoading: boolean
     * @param CRD: the CRD we are viewing
     * @param deleted: boolean used to render out if the CRD has been deleted
     * @param custom_resources: CRs of this CRD (if there are any)
     * @param template: CR of the template (if there is a template selected for this CRD)
     * @param isDraggable: if on a custom view, if the component is allowed to be dragged around
     * @param isPinned: if on a custom view, if the component is set static
     * @param CRshown: actual custom resources shown in the page
     * @param multi: if the template is a cluster of more custom resources
     * @param customViews: if we are on a custom view, it's the one
     * @param showCreate: boolean to display "create" drawer
     * @param showEditor: boolean to display "editor" drawer
     */
    this.state = {
      currentPageSizeChange: 0,
      currentPage: 1,
      pageSize: 5,
      isLoading: true,
      CRD: null,
      custom_resources: [],
      deleted: false,
      template: null,
      isPinned: false,
      CRshown: [],
      multi: false,
      customViews: [],
      showCreate: false,
      showEditor: false,
      showResources: true,
      showAnnotations: false,
      showSchema: false
    }

    this.reloadCRD = this.reloadCRD.bind(this);
    this.getCustomViews = this.getCustomViews.bind(this);
    //this.handleClick = this.handleClick.bind(this);
    this.loadCustomResources = this.loadCustomResources.bind(this);
    this.changeTemplate = this.changeTemplate.bind(this);
    this.paginationChange = this.paginationChange.bind(this);
    this.paginationSizeChange = this.paginationSizeChange.bind(this);
    this.handleClick_fav = this.handleClick_fav.bind(this);
    this.handleClick_addToView = this.handleClick_addToView.bind(this);
  }

  /** Update state if a CRD is loaded or changed */
  reloadCRD(CRDs){
    let CRD;

    if(CRDs){
      if(this.props.onCustomView){
        CRD = CRDs.find(item => {
          return item.metadata.name === this.props.CRD;
        });
      } else {
        CRD = CRDs.find(item => {
          return item.metadata.name === this.props.match.params.crdName;
        });
      }
      this.setState({ CRD: CRD });
      /** See if there is a template for the CRD */
      this.findTemplate(CRD);
    }
  }

  /** Update the custom views */
  getCustomViews(customViews){
    this.setState({customViews: customViews});
  }

  loadCustomResources() {

    /** First get all the CR */
    window.api.getCustomResourcesAllNamespaces(this.state.CRD)
      .then((res) => {
      this.setState({
        custom_resources: res.body.items,
        CRshown: res.body.items.slice(0, this.state.pageSize)
      });

      this.setState({isLoading: false});

      /** Then set up a watch to watch changes in the CR of the CRD */
      window.api.watchSingleCRD(
          this.state.CRD.spec.group,
          this.state.CRD.spec.version,
          this.state.CRD.spec.names.plural,
          this.CRnotifyEvent
      );

      /** See if there is a template for the CRD */
      this.findTemplate(this.state.CRD);
      this.findTemplate(this.state.CRD);
      }
    ).catch((error) => {
      if(error.response)
        this.props.history.push("/error/" + error.response._fetchResponse.status);
    })
  }

  componentDidMount() {
    window.api.CRDArrayCallback.push(this.reloadCRD);

    /** In case we are not on a custom view */
    if(!this.props.onCustomView){
      /** Set a callback to keep track of custom view's update */
      window.api.CVArrayCallback.push(this.getCustomViews);
      /** Get the custom views */
      this.state.customViews = window.api.customViews;
      /** Get the CRD */
      this.state.CRD = window.api.getCRDfromName(this.props.match.params.crdName);
    }
    /** In case we are in a custom view */
    else {
      this.state.CRD = window.api.getCRDfromName(this.props.CRD);
    }
    if(this.state.CRD){
      this.loadCustomResources();
    }

    this.tempTemplate = null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(!prevState.CRD && this.state.CRD){
      this.loadCustomResources();
    }
  }

  /** When unmounting, eliminate every callback and watch */
  componentWillUnmount() {
    window.api.abortAllWatchers(this.state.CRD.spec.names.plural);
    window.api.CRDArrayCallback = window.api.CRDArrayCallback.filter(func => {return func !== this.reloadCRD});
    if(!this.props.onCustomView)
      window.api.CVArrayCallback = window.api.CVArrayCallback.filter(func => {return func !== this.getCustomViews});
  }

  /** @NOT_USED: if we want to implement the deletion of the CRD... */
  /*handleClick() {
    let promise = window.api.deleteCRD(this.name);

    promise
      .then(() => {
        this.setState({
          deleted: true
        });
      })
      .catch(() => {
        this.setState({
          deleted: false
        });
      });
  }*/

  /** Update CRD with the 'favourite' annotation */
  async handleClick_fav(){
    if(!this.state.CRD.metadata.annotations || !this.state.CRD.metadata.annotations.favourite){
      this.state.CRD.metadata.annotations = {favourite: 'true'};
    } else {
      this.state.CRD.metadata.annotations.favourite = null;
    }
    await window.api.updateCustomResourceDefinition(
      this.state.CRD.metadata.name,
      this.state.CRD
    )
  }

  /** check if this CRD is already in a custom view */
  checkAlreadyInView(e){
    let cv = this.state.customViews.find(item => {
      return item.metadata.name === e;
    });
    if(cv.spec.crds){
      return !!cv.spec.crds.find(item => {
        if(item)
          return item.crdName === this.state.CRD.metadata.name;
      });
    }
  }

  /** Update the custom view CR and include this CRD */
  handleClick_addToView(e){
    let cv = this.state.customViews.find(item => {
      return item.metadata.name === e.key;
    });
    let index = -1;

    /** Search if the CRD is in the view */
    if(cv.spec.crds){
      index = cv.spec.crds.indexOf(
        cv.spec.crds.find(item => {
          if(item)
            return item.crdName === this.state.CRD.metadata.name;
        }));
    } else {
      cv.spec.crds = [];
    }

    /** If the CRD is in the view, remove it
     *  or else, add it in the view
     */
    if(index !== -1){
      cv.spec.crds[index] = null;
    } else {
      cv.spec.crds.push({
        crdName: this.state.CRD.metadata.name
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
        notification.success({
          message: APP_NAME,
          description: 'Resource updated'
        });
      })
      .catch((error) => {
        console.log(error)
        notification.error({
          message: APP_NAME,
          description: 'Could not update the resource'
        });
      });
  }

  header() {
    const items = [];

    if(window.api.customViews){
      this.state.customViews.forEach(item => {
        items.push(
          <Menu.Item key={item.metadata.name} onClick={this.handleClick_addToView}>
            {
              item.spec.viewName ? (
                <span style={this.checkAlreadyInView(item.metadata.name) ? {
                  color: 'red'
                } : null}>{ item.spec.viewName }</span>
              ) : (
                <span style={this.checkAlreadyInView(item.metadata.name) ? {
                  color: 'red'
                } : null}>{ item.metadata.name }</span>
              )
            }
          </Menu.Item>
        )
      });
    }

    if(items.length === 0){
      items.push(
        <Menu.Item key={'no-item'}>No custom views</Menu.Item>
      )
    }

    const menu = (
      <Menu>
        {items}
        <Menu.Item key="addCV" >
          <AddCustomView  selected={this.state.CRD.metadata.name} />
        </Menu.Item>
      </Menu>
    );

    return (
      <div>
        <div>
          <Badge color='#1890FF' text={<Link to={{
            pathname: '/customresources/' + this.state.CRD.metadata.name,
            state: {
              CRD: this.state.CRD
            }
          }} >
            <Tooltip title={this.state.CRD.metadata.name} placement={'top'}>
              <Typography.Text strong style={{fontSize: 20}}>
                {this.props.altName ? this.props.altName
                  : this.state.CRD.spec.names.kind}
              </Typography.Text>
            </Tooltip>
          </Link>} />
          <Rate className="crd-fav" count={1}
                value={
                  this.state.CRD.metadata.annotations &&
                  this.state.CRD.metadata.annotations.favourite ? 1 : 0
                }
                onChange={this.handleClick_fav}
                style={{marginLeft: 10}}
          />
          {
            !this.props.onCustomView ? (
              <div style={{float: "right"}}>
                <Space align={'center'}>
                  <Tooltip title={'Add or Remove to View'} placement={'topLeft'}>
                      <Dropdown.Button overlay={menu} placement="bottomCenter"
                                       style={{paddingTop: 6}}
                                       trigger={['click']} icon={<LayoutOutlined />} />
                  </Tooltip>
                  <Tooltip title={'Edit design'} placement={'top'}>
                    <Button icon={<PictureOutlined />} type="primary"
                            onClick={() => {this.setState({showEditor: true})}}/>
                  </Tooltip>
                  <Tooltip title={'Create new resource'} placement={'topRight'}>
                    <Button icon={<PlusOutlined />} type="primary"
                            onClick={() => {this.setState({showCreate: true});}} />
                  </Tooltip>
                </Space>
                <Drawer
                  title={
                    <Badge status="processing"
                           text={'Customize the design for: ' + this.state.CRD.spec.names.kind}
                    />
                  }
                  placement={'right'}
                  visible={this.state.showEditor}
                  onClose={() => {this.setState({showEditor: false})}}
                  width={'40%'}
                  destroyOnClose
                >
                  <DesignEditorCRD CRD={this.state.CRD}
                                   this={this}
                                   CR={this.state.custom_resources}
                  />
                </Drawer>
                <Drawer
                  title={
                    <Badge status="processing"
                           text={"Create a new " + this.state.CRD.spec.names.kind + " resource"}
                    />
                  }
                  placement={'right'}
                  visible={this.state.showCreate}
                  onClose={() => {this.setState({showCreate: false})}}
                  width={'40%'}
                  destroyOnClose
                >
                  <NewCR CRD={this.state.CRD} this={this}  />
                </Drawer>
              </div>
              ) : (
              <div style={{float: 'right'}}>
                <Tooltip title={'Pin'} placement={'top'}>
                  <PushpinOutlined style={this.state.isPinned ?
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
                                     if(this.state.isPinned){
                                       this.setState({isPinned: false});
                                     } else {
                                       this.setState({isPinned: true});
                                     }
                                     this.props.func(this.state.CRD.metadata.name);
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
              {
                this.state.CRD.metadata.annotations && this.state.CRD.metadata.annotations.description ? (
                  <Typography.Text type={'secondary'}>{this.state.CRD.metadata.annotations.description}</Typography.Text>
                ) : (
                  <Typography.Text type={'secondary'}>No description for this CRD</Typography.Text>
                )
              }
            </Descriptions.Item>
          </Descriptions>
          {
            (this.state.template || this.tempTemplate) ? (
              <div style={{float: 'right'}}>
                <Tooltip placement="left" title="Change CR design">
                  <Switch defaultChecked onChange={this.changeTemplate}/>
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
  CRnotifyEvent(type, object) {

    let custom_resources = this.state.custom_resources;

    let index = custom_resources.indexOf(custom_resources.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(index !== -1) {
        if(JSON.stringify(custom_resources[index]) !== JSON.stringify(object)){
          custom_resources[index] = object;
          notification.success({
            message: APP_NAME,
            description: 'Resource ' + object.metadata.name + ' modified'
          });
        } else {
          return;
        }
      } else {
        custom_resources.push(object);

        notification.success({
          message: APP_NAME,
          description: 'Resource ' + object.metadata.name + ' added'
        });
      }
    } else if (type === 'DELETED') {
      if(index !== -1) {
        custom_resources.splice(index, 1);

        notification.success({
          message: APP_NAME,
          description: 'Resource ' + object.metadata.name + ' deleted'
        });
      } else {
        return;
      }
    }

    this.setState({
      custom_resources: custom_resources,
      CRshown: custom_resources.slice(0, this.state.pageSize)
    })
  }

  /**
   * Function that get the CR template for the current CRD
   * @param CRD: this CRD
   */
  findTemplate(CRD) {
    if ((CRD.metadata.annotations && CRD.metadata.annotations.template) || this.props.altTemplate) {
      let CR = null;
      let array = [];
      if(this.props.altTemplate){
        array = this.props.altTemplate.split('/');
      }else{
        array = CRD.metadata.annotations.template.split('/');
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

        this.setState({template: CR});
      }).catch(error => {
        console.log(error);
        if(error.response)
          this.props.history.push("/error/" + error.response._fetchResponse.status);
      });
    } else {
      this.setState({template: null});
    }
  };

  /** Change from custom template to default */
  changeTemplate(checked){
    if(!checked){
      this.tempTemplate = this.state.template;
      this.setState({template: null});
    } else {
      this.setState({template: this.tempTemplate});
      this.tempTemplate = null;
    }
  };

  /** When going to another page, change the CRDs shown */
  paginationChange(current, size){
    if(this.state.currentPageSizeChange !== 0){
      current = this.state.currentPageSizeChange;
      this.state.currentPageSizeChange = 0;
    }
    this.state.currentPage = current;
    this.setState({
      CRshown: this.state.custom_resources.slice(size*(current-1), size*current)
    });
  }

  /** When changing pagination size, change CRDs shown */
  paginationSizeChange(current, size){
    if(size > this.state.pageSize)
      this.state.currentPageSizeChange = Math.ceil((this.state.pageSize*current)/size);
    else this.state.currentPageSizeChange = Math.floor(((this.state.pageSize*(current-1))/size) + 1);
    this.state.pageSize = size;
  }

  render() {

    if(this.state.isLoading){
      return (
        <div>
          <LoadingIndicator style={{marginTop: 100}} />
        </div>
      );
    }

    const utils = new Utils();
    let schema = null;
    if(this.state.CRD.spec.validation)
      schema = utils.OAPIV3toJSONSchema(this.state.CRD.spec.validation.openAPIV3Schema);

    /** array of CR components */
    const CRViews = [];

    /** temp solution for graphs (in general for multi-item designs) */
    if(this.state.template && this.state.template.kind === 'Graph'){
      this.state.multi = true;
      CRViews.push(
        <GraphNet key={'0'}
          custom_resources={this.state.custom_resources}
          template={this.state.template} CRD={this.state.CRD}
        />
      )
    } else {
      this.state.multi = false;
      this.state.CRshown.forEach(item => {
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
              crd={this.state.CRD}
              template={this.state.template}
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
    if(this.state.CRD.metadata.annotations){
      for(let annotation of Object.entries(this.state.CRD.metadata.annotations)) {
        CRD_annotations.push(
          <Tag key={annotation} style={{maxWidth: '100%'}} aria-label={'tag'}>
            <pre>{JSON.stringify(annotation, null, 2)}</pre>
          </Tag>
        );
      }
    }

    let width = '70%';

    /** Let the user choose how many CRD to visualize in a row */
    if(this.props.onCustomView){
       width = '100%';
    }

    const content = (
      <div>
        { !this.state.deleted ? (
          <div>
            <div className="crd-header">
              <Layout style={{background: '#fff'}}>
                {this.header()}
              </Layout>
              <Layout style={{background: '#fff'}}>
                <Layout.Content>
                  { this.props.onCustomView ? (
                    <div>
                      <Divider style={{marginTop: 0, marginBottom: 15}}/>
                      {CRViews}
                      { !this.state.multi && this.state.custom_resources.length > 5 ? (
                        <div className="no-crds-found" aria-label={'pagination'}>
                          <Pagination total={this.state.custom_resources.length}
                                      current={this.state.currentPage} pageSize={this.state.pageSize}
                                      onChange={this.paginationChange}
                                      showSizeChanger={true} onShowSizeChange={this.paginationSizeChange}
                                      pageSizeOptions={[5, 10, 20, 50, 100]}
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <Divider style={{marginTop: 0, marginBottom: 15, marginLeft: -24, marginRight: -24, width: '100vw'}}/>
                      { this.state.showAnnotations ? (
                        CRD_annotations.length > 0 ? (
                          <div>{CRD_annotations}</div>
                        ) : (
                          <Empty key={'empty_ann'} description={<strong>No annotations</strong>}/>
                        )
                      ) : null}
                      { this.state.showResources ? (
                        <>
                          {CRViews}
                          { !this.state.multi && this.state.custom_resources.length > 5 ? (
                            <div className="no-crds-found" aria-label={'pagination'}>
                              <Pagination total={this.state.custom_resources.length}
                                          current={this.state.currentPage} pageSize={this.state.pageSize}
                                          onChange={this.paginationChange}
                                          showSizeChanger={true} onShowSizeChange={this.paginationSizeChange}
                                          pageSizeOptions={[5, 10, 20, 50, 100]}
                              />
                            </div>
                          ) : null}
                        </>
                      ) : null}
                      {/** Show the JSON Schema of the CRD */}
                      { this.state.showSchema ? (
                        schema ? (
                          <pre aria-label={'schema'}>{JSON.stringify(schema.properties.spec, null, 2)}</pre>
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
        ) : null
        }
      </div>
    )

    return (
      <div aria-label={'crd'}>
        {!this.props.onCustomView ? (
          <Card style={{maxWidth: width, margin: 'auto'}}
                actions={[
                  <div onClick={() => this.setState({
                    showAnnotations: true,
                    showResources: false,
                    showSchema: false
                  })}>
                    <Typography.Text strong>Annotations</Typography.Text>
                  </div>
                  ,
                  <div onClick={() => this.setState({
                    showAnnotations: false,
                    showResources: true,
                    showSchema: false
                  })}>
                    <Typography.Text strong>Resources</Typography.Text>
                  </div>,
                  <div onClick={() => this.setState({
                    showAnnotations: false,
                    showResources: false,
                    showSchema: true
                  })}>
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
    );
  }
}

export default CRD;
