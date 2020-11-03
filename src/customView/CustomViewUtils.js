import ReactResizeDetector from 'react-resize-detector';
import React from 'react';

export function onResize(_layout, oldLayoutItem, layoutItem, resources, setResources, layout, setLayout, newBr) {
  if(!oldLayoutItem) return;
  let index = resources.indexOf(resources.find(item => {return item.metadata.name === layoutItem.i}));

  /** When changing width */
  if(oldLayoutItem.w !== layoutItem.w){
    resources[index].width = layoutItem.w;
  }
  /** When changing height */
  if(oldLayoutItem.h !== layoutItem.h){
    resources[index].height = layoutItem.h;
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
