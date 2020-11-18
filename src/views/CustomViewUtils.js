import ReactResizeDetector from 'react-resize-detector';
import React from 'react';

export function onDrag(_layout, oldLayoutItem, layoutItem, CRDs, setCRDs, layout, setLayout, newBr){
  if(!_.isEqual(oldLayoutItem, layoutItem)){
    CRDs.forEach(CRD => {
      let l = _layout.find(item => {return item.i === CRD.metadata.name});
      CRD.x = l.x;
      CRD.y = l.y;
    })
    setLayout(prev => {
      prev[newBr] = _layout;
      return {...prev}
    });
  }
}

export function onResize(_layout, oldLayoutItem, layoutItem, CRDs, setCRDs, layout, setLayout, newBr) {
  if(!oldLayoutItem) return;
  let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === layoutItem.i}));

  /** When changing width */
  if(oldLayoutItem.w !== layoutItem.w){
    CRDs[index].width = layoutItem.w;
  }
  /** When changing height */
  if(oldLayoutItem.h !== layoutItem.h){
    CRDs[index].height = layoutItem.h;
  }

  setLayout(prev => {
    prev[newBr] = _layout;
    return {...prev}
  });
}

export function resizeDetector(setWidth, setBreakpoint){
  return(
    <ReactResizeDetector handleWidth
                         refreshMode={'throttle'} refreshRate={150}
                         onResize={(width) => {
                           let breakpoint;
                           if(width > 1000)
                             breakpoint = 'lg';
                           else if(width < 1000 && width > 796)
                             breakpoint = 'md';
                           else if(width < 796 && width > 568)
                             breakpoint = 'sm';
                           else if(width < 568 && width > 280)
                             breakpoint = 'xs';
                           else if(width < 280 && width > 0)
                             breakpoint = 'xss';
                           setWidth(width)
                           setBreakpoint(breakpoint);
                           window.dispatchEvent(new Event('resize'));
                         }} />
  )
}
