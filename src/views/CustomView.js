import React, { Component } from 'react';
import './CustomView.css';
import CRD from '../CRD/CRD';
import LoadingIndicator from '../common/LoadingIndicator';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import ReactResizeDetector from 'react-resize-detector';

const ResponsiveGridLayout = WidthProvider(Responsive);

//TODO: offer possibility to save the layout via button (don't know where to put it)

class CustomView extends Component {
  constructor(props) {
    super(props);

    this.flag = true;

    this.state = {
      templates: [],
      customView: null,
      CRDs: [],
      isLoading: true,
      layout: { lg: [] } ,
      CRDView: [],
      oldBr: 'lg',
      newBr: 'lg'
    }

    this.loadCRD = this.loadCRD.bind(this);
    this.getCustomViews = this.getCustomViews.bind(this);
    this.props.api.CRDArrayCallback.push(this.loadCRD);
    this.props.api.CVArrayCallback.push(this.getCustomViews);

    this.generateLayout = this.generateLayout.bind(this);
    this.onResize = this.onResize.bind(this);
    this.childDrag = this.childDrag.bind(this);
    this.childPin = this.childPin.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
  }

  /** Update the custom views */
  getCustomViews(customViews){
    let customView = customViews.find(item => {
      return item.metadata.name === this.props.match.params.viewName;
    })
    this.state.customView = customView;
    this.state.templates = customView.spec.templates;
    if(this.state.customView.spec.layout){
      this.state.layout = this.state.customView.spec.layout;
    }
    this.loadCRD();
  }

  loadCRD(apiCRDs){
    if(!apiCRDs){
      this.state.CRDs = [];
      this.setState({isLoading: true});
    } else {
      if(this.state.CRDs.length !== this.state.templates.length){
        this.state.CRDs = [];
        this.setState({isLoading: true});
      } else {
        return;
      }
    }

    this.resetKind();

    this.state.templates.forEach(item => {
      let res = this.props.api.getCRDfromName(item.kind);

      if(!res && item.name){
        res = this.props.api.getCRDfromName(item.name);
      }
      /** CRDs could be no yet loaded */
      if(res){
        let CRDs = this.state.CRDs;
        /** If a template is defined in the CR, use that one */
        if(item.template){
          res.metadata.annotations.template = item.template;
        }
        /** If a custom name is defined, use that one */
        if(item.name){
          res.spec.names.kind = item.name;
        }
        CRDs.push(res);
        this.setState({CRDs: CRDs});

        /** if there's a layout for this CRD, set it */
        let CRDlayout = null;
        if (this.state.layout.lg) {
          CRDlayout = this.state.layout.lg.find(item => {return item.i === CRDs[CRDs.length - 1].metadata.name})
          if(CRDlayout){
            CRDs[CRDs.length - 1].x = CRDlayout.x;
            CRDs[CRDs.length - 1].y = CRDlayout.y;
            CRDs[CRDs.length - 1].height = CRDlayout.h;
            CRDs[CRDs.length - 1].width = CRDlayout.w;
            CRDs[CRDs.length - 1].draggable = false;
            CRDs[CRDs.length - 1].static = false;
          }
        }

        this.generateCRDView();
        if(CRDs.length === this.state.templates.length)
          this.generateLayout();
      }
    });
  }

  /** Reset the kind of the CRDs to the original one
   *  and not the name given in the custom view
   */
  resetKind(){
    this.state.templates.forEach(item => {
      if(item.name){
        let res = this.props.api.getCRDfromKind(item.name);
        if(res)
          res.spec.names.kind = item.kind;
      }
    });
  }

  generateCRDView(){
    let CRDView = [];

    this.state.CRDs.forEach(item => {
      let height = 350;
      let CRDs = this.state.CRDs;
      let index = CRDs.indexOf(CRDs.find(_item => {return _item.metadata.name === item.metadata.name}));
      if(CRDs[index].height)
        height = (CRDs[index].height * 350) + (CRDs[index].height - 1)*20 ;
      CRDView.push(
        <div key={item.metadata.name}>
          <CRD
            CRD={item.metadata.name}
            api={this.props.api}
            onCustomView={true}
            dragFunc={this.childDrag}
            pinFunc={this.childPin}
            height={height}
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
      isLoading: false,
      oldBr: this.state.newBr
    }, () => {this.onLayoutChange(layout)});

    //console.log(191, layout);
  }

  componentDidMount() {
    this.state.customView = this.props.api.customViews.find(item => {
      return item.metadata.name === this.props.match.params.viewName;
    })
    if(this.state.customView){
      if(this.state.customView.spec.layout){
        this.state.layout = this.state.customView.spec.layout;
      }
      this.state.templates = this.state.customView.spec.templates;
      this.loadCRD();
    }
  }

  /** Save layout to CR when exit */
  componentWillUnmount() {
    /**
     * Cancel all callback for the CRDs
     * Cancel all watchers
     * If necessary, reset the CRD kind to the original kind
     * Then save the layout
     */
    this.props.api.CRDArrayCallback = [];
    this.props.api.CVArrayCallback = this.props.api.CVArrayCallback.filter(func => {
      return func !== this.getCustomViews;
    });
    this.props.api.abortAllWatchers();
    this.resetKind();
    this.state.customView.spec.layout = this.state.layout;
    for(let i = 0; i < this.state.customView.spec.layout.lg.length; i++){
      delete this.state.customView.spec.layout.lg[i].isDraggable;
      delete this.state.customView.spec.layout.lg[i].static;
    }
    let array = this.state.customView.metadata.selfLink.split('/');
    this.props.api.updateCustomResource(
      array[2],
      array[3],
      this.state.customView.metadata.namespace,
      array[6],
      this.state.customView.metadata.name,
      this.state.customView
    ).catch((error) => {
      console.log(error);
    })
  }

  childLogic(id, type){
    let CRDs = this.state.CRDs;
    let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === id}));
    if(type === 'drag') {
      CRDs[index].draggable = !CRDs[index].draggable;
    } else {
      CRDs[index].static = !CRDs[index].static;
    }
    this.state.CRDs = CRDs;
    this.generateLayout();
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
    if(!oldLayoutItem) return;

    /** When changing width */
    if(oldLayoutItem.w !== layoutItem.w){
      let CRDs = this.state.CRDs;
      let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === layoutItem.i}));
      CRDs[index].width = layoutItem.w;
      this.state.CRDs = CRDs;
      this.generateLayout();
    }
    /** When changing height */
    if(oldLayoutItem.h !== layoutItem.h){
      let CRDs = this.state.CRDs;
      let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === layoutItem.i}));
      let offset = (layoutItem.h - 1) * 20;
      if(layoutItem.h < oldLayoutItem.h){
        offset = -(offset);
      }
        this.state.CRDView[index] = (
          <div key={CRDs[index].metadata.name}>
            <CRD
              CRD={CRDs[index].metadata.name}
              api={this.props.api}
              onCustomView={true}
              resizeParentFunc={this.childSize}
              dragFunc={this.childDrag}
              pinFunc={this.childPin}
              height={(layoutItem.h * 350) + offset}
            />
          </div>
        )
        CRDs[index].height = layoutItem.h;
        this.setState({CRDs: CRDs});
    }
  }

  onLayoutChange(layout){
    console.log(layout);
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
      <div>
        {
          /**
           * This is an ugly workaround but it's the best solution I found:
           *  it is necessary because the ResponsiveGridLayout's WidthProvider
           *  only detect width resize when the actual window is being resized,
           *  so here I trigger the event to trick it
           */
        }
        <ReactResizeDetector skipOnMount handleWidth
                             refreshMode={'throttle'} refreshRate={150}
                             onResize={() => {
                               window.dispatchEvent(new Event('resize'));
                             }} />
        <ResponsiveGridLayout className="react-grid-layout" layouts={this.state.layout} margin={[40, 20]}
                              breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                              cols={{lg: 3, md: 2, sm: 1, xs: 1, xxs: 1}}
                              compactType={'vertical'} rowHeight={350} onResizeStop={this.onResize}
                              onLayoutChange={this.onLayoutChange} onBreakpointChange={this.onBreakpointChange}
        >
          {this.state.CRDView}
        </ResponsiveGridLayout>
      </div>
    );
  }
}

export default CustomView;
