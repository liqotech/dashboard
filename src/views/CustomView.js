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
    this.props.api.CVArrayCallback.push(this.getCustomViews);

    this.onDrag = this.onDrag.bind(this);
    this.generateLayout = this.generateLayout.bind(this);
    this.onResize = this.onResize.bind(this);
    this.childLogic = this.childLogic.bind(this);
    this.onBreakpointChange = this.onBreakpointChange.bind(this);
  }

  /** Update the custom views */
  getCustomViews(customViews){
    let customView = customViews.find(item => {
      return item.metadata.name === this.props.match.params.viewName;
    })

    if(!this.state.customView){
      this.state.customView = customView;
      this.state.templates = customView.spec.templates;
      if (this.state.customView.spec.layout) {
        this.state.layout = this.state.customView.spec.layout;
      }
      this.loadCRD();
    }else{
      /** Update layout only if something really changed */
      if(JSON.stringify(this.state.customView) !== JSON.stringify(customView)) {
        this.state.customView = customView;
        this.state.templates = customView.spec.templates;
        if (this.state.customView.spec.layout) {
          this.state.layout = this.state.customView.spec.layout;
        }
        this.loadCRD();
      }
    }
  }

  loadCRD(){
    this.state.CRDs = [];
    this.setState({isLoading: true});

    this.state.templates.forEach(item => {
      let res = {metadata: {name: item.kind}}

      /** CRDs could be no yet loaded */
      if(res){
        let CRDs = this.state.CRDs;
        /** If a template is defined in the CR, use that one */
        if(item.template){
          res.altTemplate = item.template;
        }
        /** If a custom name is defined, use that one */
        if(item.name){
          res.altName = item.name;
        }
        CRDs.push(res);
        this.setState({CRDs: CRDs});

        /** if there's a layout for this CRD, set it */
        let CRDlayout = null;
        if (this.state.layout[this.state.newBr]) {
          CRDlayout = this.state.layout[this.state.newBr].find(item => {return item.i === CRDs[CRDs.length - 1].metadata.name})
          if(CRDlayout){
            CRDs[CRDs.length - 1].x = CRDlayout.x;
            CRDs[CRDs.length - 1].y = CRDlayout.y;
            CRDs[CRDs.length - 1].height = CRDlayout.h;
            CRDs[CRDs.length - 1].width = CRDlayout.w;
            CRDs[CRDs.length - 1].static = false;
          }
        }

        this.generateCRDView();
        if(CRDs.length === this.state.templates.length)
          this.generateLayout();
      }
    });
  }

  /** Create the CRD cards */
  generateCRDView(){
    let CRDView = [];

    this.state.CRDs.forEach(item => {
      if(this.props.api.getCRDfromName(item.metadata.name)){
        CRDView.push(
          <div key={item.metadata.name} className="crd-content" aria-label={'crd_custom_view'} >
            <div style={{overflow: 'auto', height: '100%'}}>
              <CRD
                CRD={item.metadata.name}
                altName={item.altName}
                altTemplate={item.altTemplate}
                api={this.props.api}
                onCustomView={true}
                func={this.childLogic}
              />
            </div>
          </div>
        );
      }
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
      let s = false;
      let CRDlayout = null;
      if (this.state.layout[this.state.newBr]) {
        CRDlayout = this.state.layout[this.state.newBr].find(item => {return item.i === this.state.CRDs[i].metadata.name})
      }
      /** Stay where I put you even when the layout is regenerated */
      if(CRDlayout){
        x = CRDlayout.x;
        y = CRDlayout.y;
      }
      if(this.state.CRDs[i].height){
        h = this.state.CRDs[i].height;
      }
      if(this.state.CRDs[i].width){
        w = this.state.CRDs[i].width;
      }
      if(this.state.CRDs[i].static){
        s = this.state.CRDs[i].static;
      }
      layout.push({
        i: this.state.CRDs[i].metadata.name, x: x, y: y, w: w, h: h, isDraggable: true, static: s
      });
    }
    let layouts = this.state.layout;
    layouts[this.state.newBr] = layout;
    this.setState({
      isLoading: false,
      oldBr: this.state.newBr,
      layout: layouts
    });
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
     * Then save the layout
     */
    this.props.api.CVArrayCallback = this.props.api.CVArrayCallback.filter(func => {
      return func !== this.getCustomViews;
    });
    this.props.api.abortAllWatchers();
    this.state.customView.spec.layout = this.state.layout;
    for(let i = 0; i < this.state.customView.spec.layout[this.state.newBr].length; i++){
      delete this.state.customView.spec.layout[this.state.newBr][i].isDraggable;
      delete this.state.customView.spec.layout[this.state.newBr][i].static;
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

  childLogic(id){
    let CRDs = this.state.CRDs;
    let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === id}));
    CRDs[index].static = !CRDs[index].static;
    this.state.CRDs = CRDs;

    /**
     * This is a workaround for some kind of issue with the RGL:
     *  updating directly the state layout doesn't work, so it is
     *  necessary to deep copy it, modify the copy and set it as
     *  the new layout
     */
    let newLayouts = JSON.parse(JSON.stringify(this.state.layout));
    newLayouts[this.state.newBr].find(item => {return item.i === CRDs[index].metadata.name})
      .static = CRDs[index].static;
    this.setState({layout: newLayouts});
  }

  onDrag(layout, oldLayoutItem, layoutItem){
    if(JSON.stringify(oldLayoutItem) !== JSON.stringify(layoutItem)){
      let CRDs = this.state.CRDs;
      CRDs.forEach(CRD => {
        let l = layout.find(item => {return item.i === CRD.metadata.name});
        CRD.x = l.x;
        CRD.y = l.y;
      })

      this.state.layout[this.state.newBr] = layout;
      this.state.CRDs = CRDs;
    }
  }

  onResize(layout, oldLayoutItem, layoutItem) {
    if(!oldLayoutItem) return;
    let CRDs = this.state.CRDs;
    let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === layoutItem.i}));

    /** When changing width */
    if(oldLayoutItem.w !== layoutItem.w){
      CRDs[index].width = layoutItem.w;
      this.state.CRDs = CRDs;
    }
    /** When changing height */
    if(oldLayoutItem.h !== layoutItem.h){
      CRDs[index].height = layoutItem.h;
      this.state.CRDs = CRDs;
    }

    this.state.layout[this.state.newBr] = layout;
  }

  onBreakpointChange(br){
    this.state.oldBr = this.state.newBr;
    this.state.newBr = br;
    this.generateLayout();
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
        <ResponsiveGridLayout className="react-grid-layout" layouts={this.state.layout} margin={[20, 20]}
                              breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                              cols={{lg: 3, md: 2, sm: 1, xs: 1, xxs: 1}}
                              compactType={'vertical'} rowHeight={350} onResizeStop={this.onResize}
                              onBreakpointChange={this.onBreakpointChange}
                              draggableHandle={'.draggable'} onDragStop={this.onDrag}
        >
          {this.state.CRDView}
        </ResponsiveGridLayout>
      </div>
    );
  }
}

export default CustomView;
