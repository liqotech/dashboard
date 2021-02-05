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

export function resizeDetector(setWidth, setBreakpoint, brCustom){
  return(
    <ReactResizeDetector handleWidth
                         refreshMode={'throttle'} refreshRate={150}
                         onResize={(width) => {
                           let brWidth = {
                             lg: brCustom && brCustom['lg'] ? brCustom['lg'] : 1000,
                             md: brCustom && brCustom['md'] ? brCustom['md'] : 796,
                             sm: brCustom && brCustom['sm'] ? brCustom['sm'] : 568,
                             xs: brCustom && brCustom['xs'] ? brCustom['xs'] : 280,
                             xss: brCustom && brCustom['xss'] ? brCustom['xss'] : 0
                           }
                           let breakpoint;
                           if(width > brWidth['lg'])
                             breakpoint = 'lg';
                           else if(width < brWidth['lg'] && width > brWidth['md'])
                             breakpoint = 'md';
                           else if(width < brWidth['md'] && width > brWidth['sm'])
                             breakpoint = 'sm';
                           else if(width < brWidth['sm'] && width > brWidth['xs'])
                             breakpoint = 'xs';
                           else if(width < brWidth['xs'] && width > brWidth['xss'])
                             breakpoint = 'xss';
                           setWidth(width)
                           setBreakpoint(breakpoint);
                           window.dispatchEvent(new Event('resize'));
                         }} />
  )
}
