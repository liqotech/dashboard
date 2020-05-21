import React, { Component } from 'react';
import './CRD.css';
import './CRDList.css';
import {
  Badge,
  Breadcrumb,
  Button,
  Layout,
  notification,
  Tabs,
  Tag,
  Typography,
  Popover,
  Row,
  Tooltip,
  Col, Descriptions, Switch
} from 'antd';
import CR from './CR';
import { Link } from 'react-router-dom';
import { APP_NAME } from '../constants';
import LoadingIndicator from '../common/LoadingIndicator';
import GraphNet from '../templates/graph/GraphNet';
import Utils from '../services/Utils';
import PlusOutlined from '@ant-design/icons/lib/icons/PlusOutlined';
import PictureOutlined from '@ant-design/icons/lib/icons/PictureOutlined';
import Measure from 'react-measure';
import DragOutlined from '@ant-design/icons/lib/icons/DragOutlined';
import PushpinOutlined from '@ant-design/icons/lib/icons/PushpinOutlined';
const { Title } = Typography;

class CRD extends Component {
  constructor(props) {
    super(props);
    this.CRDnotifyEvent = this.CRDnotifyEvent.bind(this);
    this.CRnotifyEvent = this.CRnotifyEvent.bind(this);

    /** If we are NOT on a custom view */
    if(!this.props.onCustomView){
      /** Kill all watchers, otherwise the requests get stuck in pending */
      this.props.api.abortAllWatchers(true);
    } else {
      /** @NOT-NECESSARY Kill all watchers but the one that watch all the CRDs */
      // this.props.api.abortAllWatchers();
    }

    /**
     * @param template: CR of the template (if there is a template selected for this CRD)
     * @param custom_resources: CRs of this CRD (if there are any) 
     * @param controller: used to kill the watch on this CRD
     * @param deleted: boolean used to render out if the CRD has been deleted
     * @param CRD: the CRD we are viewing
     * @param isLoading: boolean
     */
    this.state = {
      isLoading: true,
      CRD: null,
      custom_resources: [],
      deleted: false,
      template: null,
      isDraggable: false,
      isPinned: false
    }

    /** In case we are not on a custom view */
    if(!this.props.onCustomView){
      /** If there is no CRD passed from a parent component, get it using the api */
      if(this.props.location.state === undefined){
        this.props.api.getCRDfromName(this.props.match.params.crdName).then((res) => {
          this.state.CRD = res;
          this.loadCustomResources();
        });
      } else {
        this.state.CRD = this.props.location.state.CRD;
        this.loadCustomResources();
      }
    }
    /** In case we are in a custom view */
    else {
      this.state.CRD = this.props.CRD;
      this.loadCustomResources();
    }

    this.tempTemplate = null;

    this.printRepresentation = this.printRepresentation.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.deleteCR = this.deleteCR.bind(this);
    this.abortWatchers = this.abortWatchers.bind(this);
    this.loadCustomResources = this.loadCustomResources.bind(this);
    this.changeTemplate = this.changeTemplate.bind(this);
  }

  loadCustomResources() {

    if(!this.props.onCustomView) {
      /** Restart the watch on the CRDs so it can see the changes on this CRD */
      this.props.api.watchAllCRDs(this.CRDnotifyEvent);
    }
    /** First get all the CR */
    this.props.api.getCustomResourcesAllNamespaces(this.state.CRD)
      .then((res) => {
      this.setState({
        custom_resources: res.body.items
      });

      this.setState({isLoading: false});

      /** Then set up a watch to watch changes in the CR of the CRD */
      this.props.api.watchSingleCRD(
          this.state.CRD.spec.group,
          this.state.CRD.spec.version,
          this.state.CRD.spec.names.plural,
          this.CRnotifyEvent
      );

      /** See if there is a template for the CRD */
      this.findTemplate(this.state.CRD);
      }
    ).catch((error) => {
      console.log(error);
    })
  }

  componentDidUpdate() {
    if(this.props.onCustomView) {
      if (this.props.CRD !== this.state.CRD) {
        this.setState({
          CRD: this.props.CRD
        });
        this.findTemplate(this.props.CRD);
      }
    }
  }

  /**
   * Callback from CR component that deletes a CR
   * @param CR: the CR to be deleted
   */
  deleteCR(CR) {
    this.props.api.watchSingleCRD(
      this.state.CRD.spec.group,
      this.state.CRD.spec.version,
      this.state.CRD.spec.names.plural,
      this.CRnotifyEvent
    );

    /** Delete CR from the custom resources array */
    this.setState({custom_resources: this.state.custom_resources.filter(item => {
      return item !== CR;
      })}
    );
  }

  abortWatchers() {
    this.props.api.abortAllWatchers();
  }

  /** @NOT_USED: if we want to implement the deletion of the CRD... */
  handleClick() {
    let promise = this.props.api.deleteCRD(this.name);

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
  }

  header() {
    return (
      <div>
        <Row>
          <Col flex={8}>
            <Breadcrumb separator={'>'}>
              <Breadcrumb.Item>CRD</Breadcrumb.Item>
              <Breadcrumb.Item>{this.state.CRD.metadata.name}</Breadcrumb.Item>
            </Breadcrumb>
          </Col>
          {
            this.props.onCustomView ? (
              <Col flex={1}>
                <DragOutlined style={this.state.isDraggable ?
                  {
                    float: 'right', fontSize: '20px',
                    marginRight: 10, marginLeft: 25,
                    color: '#1890FF'
                  }:{
                    float: 'right', fontSize: '20px',
                    marginRight: 10, marginLeft: 25
                  }}
                  onClick={() => {
                    if(this.state.isDraggable){
                      this.setState({isDraggable: false});
                    } else {
                      this.setState({isDraggable: true});
                    }
                    this.props.dragFunc(this.state.CRD.metadata.name);
                  }}
                />
                <PushpinOutlined style={this.state.isPinned ?
                  {
                    float: 'right', fontSize: '20px',
                    marginRight: 10,
                    color: '#1890FF'
                  }:{
                    float: 'right', fontSize: '20px',
                    marginRight: 10,
                  }}
                  onClick={() => {
                    if(this.state.isPinned){
                      this.setState({isPinned: false});
                    } else {
                      this.setState({isPinned: true});
                    }
                    this.props.pinFunc(this.state.CRD.metadata.name);
                  }}
                />
              </Col>
            ) : null
          }
        </Row>
        <br />
        <Title level={4} >
          <Badge color="#108ee9" />
          {this.state.CRD.spec.names.kind}
          <div style={{float: "right"}}>
            {/** Button to go to the choose design view
             *  @param CRD: is the CRD we are currently on
             *  @param api: the apiManager instance we are using
             *  @param CR: pass the custom resources of this CRD, if there are any (to show in the design preview)
             */}
            <Link to={{
              pathname: '/customresources/' + this.state.CRD.metadata.name + '/representation_editor',
              state: {
                CRD: this.state.CRD,
                CR: this.state.custom_resources
              }}}
                  onClick={this.abortWatchers}>
              <Popover content={'Edit design'} placement={'bottom'}>
                <Button icon={<PictureOutlined />} size={'large'} type="primary"
                        style={{marginLeft: 15}}>
                </Button>
              </Popover>
            </Link>
            {/** Button to go to the create new CR view
             *  @param CRD: is the CRD we are currently on
             *  @param api: the apiManager instance we are using
             */}
            <Link to={{
              pathname: '/customresources/' + this.state.CRD.metadata.name + '/create',
              state: {
                CRD: this.state.CRD
              }}}
                  onClick={this.abortWatchers}>
              <Popover content={'Create new resource'} placement={'bottom'}>
                <Button icon={<PlusOutlined />} size={'large'} type="primary"
                        style={{marginLeft: 15}}>
                </Button>
              </Popover>
            </Link>
          </div>
        </Title>
        <Descriptions style={{marginTop: 20, marginLeft: 15}}>
          <Descriptions.Item>
            {
              this.state.CRD.metadata.annotations.description ? (
                <div>{this.state.CRD.metadata.annotations.description}</div>
              ) : (
                <div>No description for this CRD</div>
              )
            }
          </Descriptions.Item>
        </Descriptions>
      </div>
    )
  }

  /**
   * Callback for CRDs watcher trigger (if the CRD is changed)
   * @param type: description of the trigger (modify/add/delete)
   * @param object: object modified/added/deleted
   */
  CRDnotifyEvent(type, object) {

    if ((type === 'ADDED' || type === 'MODIFIED')) {
      // Object creation succeeded
      if(object.metadata.name === this.state.CRD.metadata.name){
        if(JSON.stringify(this.state.CRD) !== JSON.stringify(object)) {
          notification.success({
            message: APP_NAME,
            description: 'CRD ' + object.metadata.name + ' modified'
          });

          this.setState({ CRD: object });

          this.findTemplate(this.state.CRD);
        }
      }
    } else if (type === 'DELETED') {
      //TODO: return to the customresources page
      if(object.metadata.name === this.state.CRD.metadata.name){
        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' deleted'
        });
      }
    }
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
      custom_resources: custom_resources
    })
  }

  printRepresentation() {

  }

  /**
   * Function that get the CR template for the current CRD
   * @param CRD: this CRD
   */
  findTemplate(CRD) {
    if (CRD.metadata.annotations.template) {
      let CR = null;
      let array = CRD.metadata.annotations.template.split('/');
      this.props.api.getCustomResourcesAllNamespaces({
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
      });
    }
  };

  /** Change from custom template to default */
  changeTemplate(checked){
    if(checked){
      this.tempTemplate = this.state.template;
      this.setState({template: null});
    } else {
      this.setState({template: this.tempTemplate});
      this.tempTemplate = null;
    }
  };

  render() {

    if(this.state.isLoading){
      return (
        <div>
          <LoadingIndicator style={{marginTop: 100}} />
        </div>
      );
    }

    const utils = new Utils();
    const schema = utils.OAPIV3toJSONSchema(this.state.CRD.spec.validation.openAPIV3Schema);

    /** array of CR components */
    const CRViews = [];

    /** temp solution for graphs (in general for multi-item designs) */
    if(this.state.template && this.state.template.kind === 'Graph'){
      CRViews.push(
        <GraphNet key={'0'}
          custom_resources={this.state.custom_resources}
          template={this.state.template}
        />
      )
    } else {
      this.state.custom_resources.forEach(item => {
        CRViews.push(
          /**
           * @param api: this apiManager instance
           * @param cr: one of the CRD custom resource
           * @param crd: this CRD
           * @param func: callback for CR deletion (needs to be performed in this component because of the watcher)
           * @param template: CR of the template design for this CRD CRs
           */
          <CR key={item.metadata.namespace + '/' + item.metadata.name}
              api={this.props.api}
              cr={item}
              crd={this.state.CRD}
              func={this.deleteCR}
              template={this.state.template}
          />
        );
      })
      if(CRViews.length === 0) {
        CRViews.push(
          <Title key={'0'} level={4} style={{textAlign: 'center', marginTop: 40, marginBottom: 100}}>
            No resources
          </Title>
        )
      }
    }

    /**
     * Maybe show something else not annotations idk
     * for now it shows annotations
     */
    const CRD_annotations = [];
    for(let annotation of Object.entries(this.state.CRD.metadata.annotations)) {
      CRD_annotations.push(
        <Tag key={annotation}>
          <pre>{JSON.stringify(annotation, null, 2)}</pre>
        </Tag>
      );
    }

    let width = '70%';

    /** Let the user choose how many CRD to visualize in a row */
    if(this.props.onCustomView){
       width = '100%';
    }

    return (
      <Measure
        /** This measurement is used by the custom views */
        bounds
        onResize={(contentRect) => {
          if(this.props.resizeParentFunc){
            this.props.resizeParentFunc(contentRect.bounds.bottom - contentRect.bounds.top, this.state.CRD.metadata.name);
          }
        }}
      >
        {({measureRef}) => (
          <div className="crds-container" style={{maxWidth: width}}>
            <div className="crd-content" ref={measureRef} >
              { !this.state.deleted ? (
                <div>
                  <div className="crd-header">
                    <Layout style={{background: '#fff'}}>
                      {this.header()}
                    </Layout>
                    <Layout style={{background: '#fff'}}>
                      <Tabs defaultActiveKey="2" tabBarExtraContent={
                        this.state.template || this.tempTemplate ? (
                            <div style={{float: 'right'}}>
                              <Tooltip placement="topRight" title="Change CR design">
                                <Switch onChange={this.changeTemplate}/>
                              </Tooltip>
                            </div>
                          ) : null
                      }>
                        <Tabs.TabPane tab="Annotations" key="1">
                          {CRD_annotations}
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Resources" key="2">
                          {CRViews}
                        </Tabs.TabPane>
                        {/** Show the JSON Schema of the CRD */}
                        <Tabs.TabPane tab="Schema" key="3">
                          <pre>{JSON.stringify(schema.properties.spec, null, 2)}</pre>
                        </Tabs.TabPane>
                      </Tabs>
                    </Layout>
                  </div>
                </div>
              ) : null
              }
            </div>
          </div>
        )}
      </Measure>
    );
  }
}

export default CRD;
