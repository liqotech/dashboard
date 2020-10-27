import React, { useState, useEffect, useRef } from 'react';
import './CustomView.css';
import CRD from '../resources/CRD/CRD';
import _, { isEmpty } from 'lodash';
import LoadingIndicator from '../common/LoadingIndicator';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { onDrag, onResize, resizeDetector } from './CustomViewUtils';
import { pruneLayouts } from '../resources/common/LayoutUtils';

const ResponsiveGridLayout = WidthProvider(Responsive);

function CustomView(props) {

  const CRDsCV = useRef([]);
  const customView = useRef();
  const [CRDs, setCRDs] = useState([]);
  const [loading, setLoading] = useState(true)
  const [layout, setLayout] = useState({ lg: [] });
  const [CRDView, setCRDView] = useState([]);
  const [newBr, setNewBr] = useState('lg');
  const flag = useRef(false);

  useEffect(() => {
    window.api.CVArrayCallback.current.push(getCustomViews);
    customView.current = window.api.customViews.current.find(item => {
      return item.metadata.name === props.match.params.viewName;
    })
    if (customView.current) {
      if (customView.current.spec.layout) {
        setLayout(customView.current.spec.layout);
      }
      CRDsCV.current = customView.current.spec.crds;
      loadCRD();
    }

    return () => {
      /** Cancel all callback for the CRDs */
      window.api.CVArrayCallback.current = window.api.CVArrayCallback.current.filter(func => {
        return func !== getCustomViews;
      });
    }
  }, [props.match])

  useEffect(() => {
    generateCRDView();
    generateLayout();
  }, [CRDs, newBr])

  useEffect(() => {
    return () => {
      /**
       * Save the layout
       */

      if(!flag.current){
        flag.current = true;
        return;
      }

      if(!isEmpty(layout) && customView.current){
        customView.current.spec.layout = layout;
        let array = customView.current.metadata.selfLink.split('/');
        window.api.updateCustomResource(
          array[2],
          array[3],
          customView.current.metadata.namespace,
          array[6],
          customView.current.metadata.name,
          customView.current
        ).catch(error => console.log(error))
      }
    }
  }, [layout])

  const updateCRD = (CV, load) => {
    let changeLayout = load;
    if(!load && CV.spec.layout &&
      !_.isEqual(pruneLayouts(customView.current.spec.layout), CV.spec.layout))
      changeLayout = true

    if(changeLayout) {
      flag.current = false;
      setLayout(CV.spec.layout);
    }

    customView.current = CV;
    if(!_.isEqual(CRDsCV.current, CV.spec.crds)){
      CRDsCV.current = CV.spec.crds;
      loadCRD();
    }
  }

  /** Update the custom views */
  const getCustomViews = () => {
    let CV = window.api.customViews.current.find(item => {
      return item.metadata.name === props.match.params.viewName;
    })
    if(!CV){
      props.history.push('/')
    } else {
      if(!customView.current){
        updateCRD(CV, true);
      } else {
        /** Update layout only if something really changed */
        if(!_.isEqual(customView.current, CV)) {
          updateCRD(CV);
        }
      }
    }
  }

  const loadCRD = () => {
    setLoading(true);

    let _CRDs = [];

    CRDsCV.current.forEach(item => {
      let res = {metadata: {name: item.crdName}}
      /** If a template is defined in the CR, use that one */
      if(item.template){
        res.altTemplate = item.template;
      }
      /** If a custom name is defined, use that one */
      if(item.crdAltName){
        res.altName = item.crdAltName;
      }
      _CRDs.push(res);

      /** if there's a layout for this CRD, set it */
      let CRDlayout = null;
      if (!isEmpty(customView.current.spec.layout) && customView.current.spec.layout[newBr]) {
        CRDlayout = customView.current.spec.layout[newBr].find(item => {return item.i === _CRDs[_CRDs.length - 1].metadata.name})
        if(CRDlayout){
          _CRDs[_CRDs.length - 1].x = CRDlayout.x;
          _CRDs[_CRDs.length - 1].y = CRDlayout.y;
          _CRDs[_CRDs.length - 1].height = CRDlayout.h;
          _CRDs[_CRDs.length - 1].width = CRDlayout.w;
          _CRDs[_CRDs.length - 1].static = false;
        }
      }

      if(_CRDs.length === CRDsCV.current.length)
        setCRDs(_CRDs);
    });
  }

  /** Create the CRD cards */
  const generateCRDView = () => {
    let _CRDView = [];

    CRDs.forEach(item => {
      if(window.api.getCRDFromName(item.metadata.name)){
        _CRDView.push(
          <div key={item.metadata.name} className="crd-content" aria-label={'crd_custom_view'} >
            <div className="inner-crd" >
              <CRD
                CRD={item.metadata.name}
                altName={item.altName}
                altTemplate={item.altTemplate}
                onCustomView={true}
                func={childLogic}
              />
            </div>
          </div>
        );
      }
    })

    setCRDView(_CRDView);
  }

  /** (Re)Generate the layout based on the user preferences */
  const generateLayout = () => {
    let _layout = [];

    if(CRDs.length !== CRDsCV.current.length || CRDsCV.current.length === 0) return;

    for(let i = 0; i < CRDs.length; i++) {
      let CRDlayout = null;
      if (layout && layout[newBr]) {
        CRDlayout = layout[newBr].find(item => {return item.i === CRDs[i].metadata.name})
      }
      /** Stay where I put you even when the layout is regenerated */
      _layout.push({
        i: CRDs[i].metadata.name,
        x: CRDlayout ? CRDlayout.x : i,
        y: CRDlayout ? CRDlayout.y : 0,
        w: CRDs[i].width ? CRDs[i].width : 1,
        h: CRDs[i].height ? CRDs[i].height : 1,
        isDraggable: CRDs[i].static ? !CRDs[i].static : true,
        static: CRDs[i].static ? CRDs[i].static : false
      });
    }
    let layouts = layout ? JSON.parse(JSON.stringify(layout)) : {};
    layouts[newBr] = _layout;
    setLoading(false);
    setLayout(layouts);
  }

  const childLogic = id => {
    setCRDs(prev => {
      prev.find(item => {return item.metadata.name === id}).static = !prev.find(item => {return item.metadata.name === id}).static;
      return [...prev];
    });
  }

  const onBreakpointChange = br => {
    setNewBr(br);
  }

  if(loading)
    return <LoadingIndicator />

  return (
    <div>
      { resizeDetector() }
      <ResponsiveGridLayout className="react-grid-layout" layouts={layout} margin={[20, 20]}
                            breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                            cols={{lg: 3, md: 2, sm: 1, xs: 1, xxs: 1}}
                            compactType={'vertical'} rowHeight={350}
                            onResizeStop={(_layout, oldLayoutItem, layoutItem) => onResize(_layout, oldLayoutItem, layoutItem, CRDs, setCRDs, layout, setLayout, newBr)}
                            onBreakpointChange={onBreakpointChange}
                            onDragStop={(_layout, oldLayoutItem, layoutItem) => onDrag(_layout, oldLayoutItem, layoutItem, CRDs, setCRDs, layout, setLayout, newBr)}
                            draggableHandle={'.draggable'} >
        {CRDView}
      </ResponsiveGridLayout>
    </div>
  );
}

export default CustomView;
