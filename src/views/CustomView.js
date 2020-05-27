import React, { Component } from 'react';
import './CustomView.css';
import CRD from '../CRD/CRD';
import { notification } from 'antd';
import LoadingIndicator from '../common/LoadingIndicator';
import 'react-resizable/css/styles.css';
import { APP_NAME } from '../constants';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

//TODO: offer possibility to save the layout via button (don't know where to put it)

class CustomView extends Component {
  constructor(props) {
    super(props);

    if(!this.props.location.state) {
      this.props.history.push("/");
    }

    this.flag = true;

    this.state = {
      templates: this.props.location.state.view.spec.templates,
      CRDs: [],
      isLoading: true,
      layout: { lg: [] } ,
      CRDView: [],
      oldBr: 'lg',
      newBr: 'lg'
    }

    if(this.props.location.state.view.spec.layout){
      this.state.layout = this.props.location.state.view.spec.layout;
    }

    this.notifyEvent = this.notifyEvent.bind(this);
    this.loadCRD = this.loadCRD.bind(this);
    this.generateLayout = this.generateLayout.bind(this);
    this.childSize = this.childSize.bind(this);
    this.onResize = this.onResize.bind(this);
    this.childDrag = this.childDrag.bind(this);
    this.childPin = this.childPin.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
  }

  loadCRD(){

    /** Abort all watchers to prevent pending connections */
    this.props.api.abortAllWatchers(true);
    this.setState({isLoading: true});

    this.state.templates.forEach(item => {
      this.props.api.getCRDfromKind(item.kind)
        .then(res => {
          let CRDs = this.state.CRDs;
          /** If a template is defined in the CR, use that one */
          if(item.template){
            res.metadata.annotations.template = item.template;
          }
          if(item.name){
            res.spec.names.kind = item.name;
          }
          CRDs.push(res);
          this.setState({CRDs: CRDs});
          this.generateCRDView();
          this.generateLayout();
        })
    });
    this.props.api.watchAllCRDs(this.notifyEvent);
  }

  generateCRDView(){
    let CRDView = [];

    this.state.CRDs.forEach(item => {
      CRDView.push(
        <div key={item.metadata.name}>
          <CRD
            CRD={item}
            api={this.props.api}
            onCustomView={true}
            resizeParentFunc={this.childSize}
            dragFunc={this.childDrag}
            pinFunc={this.childPin}
          />
        </div>
      );
    })
    this.setState({CRDView: CRDView})
  }

  /** (Re)Generate the layout based on the user preferences */
  generateLayout(){
    let layout = [];

    if(this.state.CRDs.length !== this.state.templates.length) return;

    for(let i = 0; i < this.state.CRDs.length; i++) {
      let h = 1;
      let w = 1;
      let x = i;
      let y = 0;
      let d = false;
      let s = false;
      let CRDlayout = null;
      if (this.state.layout.lg) {
        CRDlayout = this.state.layout.lg.find(item => {return item.i === this.state.CRDs[i].metadata.name})
      }
      /** Stay where I put you even when the layout is regenerated */
      if(CRDlayout && this.state.oldBr === this.state.newBr){
        x = CRDlayout.x;
        y = CRDlayout.y;
      }
      if(this.state.CRDs[i].height){
        h = this.state.CRDs[i].height;
      }
      if(this.state.CRDs[i].width){
        w = this.state.CRDs[i].width;
      }
      if(this.state.CRDs[i].draggable){
        d = this.state.CRDs[i].draggable;
      }
      if(this.state.CRDs[i].static){
        s = this.state.CRDs[i].static;
      }
      layout.push({
        i: this.state.CRDs[i].metadata.name, x: x, y: y, w: w, h: h, isDraggable: d, static: s
      });
    }
    this.setState({
      layout: {lg: layout},
      isLoading: false,
      oldBr: this.state.newBr
    });
  }

  notifyEvent(type, object) {

    let CRDs = this.state.CRDs;

    let index = CRDs.indexOf(CRDs.find((item) => {
      return item.metadata.name === object.metadata.name;
    }));

    if (type === 'MODIFIED') {
      // Object creation succeeded
      if(index !== -1) {
        CRDs[index] = object;
        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' modified'
        });
      }
    } else if (type === 'DELETED') {
      if(index !== -1) {
        CRDs.splice(index, 1);

        notification.success({
          message: APP_NAME,
          description: 'CRD ' + object.metadata.name + ' deleted'
        });
      } else {
        return;
      }
    } else {
      return;
    }

    this.setState({
      CRDs: CRDs
    });
    this.generateCRDView();
  }

  componentDidMount() {
    this.loadCRD();
  }

  componentWillUnmount() {
    this.props.location.state.view.spec.layout = this.state.layout;
    let array = this.props.location.state.view.metadata.selfLink.split('/');
    this.props.api.updateCustomResource(
      array[2],
      array[3],
      this.props.location.state.view.metadata.namespace,
      array[6],
      this.props.location.state.view.metadata.name,
      this.props.location.state.view
    )
  }

  /** If the child component's size have changed, change the layout */
  childSize(size, id){
    let CRDs = this.state.CRDs;
    let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === id}));
    CRDs[index].height = (size/10) + 2;
    this.setState({CRDs: CRDs});
    this.generateLayout();
  }

  childLogic(id, type){
    let CRDs = this.state.CRDs;
    let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === id}));
    if(type === 'drag') {
      if(!CRDs[index].draggable){
        CRDs[index].draggable = true;
      } else {
        CRDs[index].draggable = !CRDs[index].draggable;
      }
    } else {
      if(!CRDs[index].static){
        CRDs[index].static = true;
      } else {
        CRDs[index].static = !CRDs[index].static;
      }
    }
    this.setState({CRDs: CRDs});
    this.generateLayout();
    if(CRDs[index].draggable){
      this.childSize((CRDs[index].height*10)-19, CRDs[index].metadata.name);
    } else {
      this.childSize((CRDs[index].height*10)-21, CRDs[index].metadata.name);
    }
  }

  /** Enable child component's draggable */
  childDrag(id){
    this.childLogic(id, 'drag');
  }

  /** Enable child component's static */
  childPin(id){
    this.childLogic(id, 'pin');
  }

  onResize(layout, oldLayoutItem, layoutItem) {
    // `oldLayoutItem` contains the state of the item before the resize.
    // You can modify `layoutItem` to enforce constraints.

    if(oldLayoutItem.w !== layoutItem.w){
      let CRDs = this.state.CRDs;
      let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === layoutItem.i}));
      CRDs[index].width = layoutItem.w;
      this.setState({CRDs: CRDs});
      this.generateLayout();
    } else {
      layoutItem.h = oldLayoutItem.h;
    }
  }

  onLayoutChange(layout){
    this.setState({layout: {lg: layout}});
  }

  onBreakpointChange(br){
    this.setState({oldBr: this.state.newBr});
    this.setState({newBr: br});
  }

  render() {

    if(this.state.isLoading)
      return <LoadingIndicator />

    return (
      <div style={{marginRight: 20}}>
        <ResponsiveGridLayout className="react-grid-layout" layouts={this.state.layout} margin={[40, 0]}
                              breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                              cols={{lg: 3, md: 2, sm: 1, xs: 1, xxs: 1}}
                              compactType={'vertical'} rowHeight={10} onResizeStop={this.onResize}
                              onLayoutChange={this.onLayoutChange} onBreakpointChange={this.onBreakpointChange}
        >
          {this.state.CRDView}
        </ResponsiveGridLayout>
      </div>
    );
  }
}

export default CustomView;
