import ReactResizeDetector from 'react-resize-detector';
import React from 'react';

export function onDrag(_layout, oldLayoutItem, layoutItem, CRDs, setCRDs, layout, setLayout, newBr){
  if(JSON.stringify(oldLayoutItem) !== JSON.stringify(layoutItem)){
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

export function resizeDetector(){
  return(
    <ReactResizeDetector skipOnMount handleWidth
                         refreshMode={'throttle'} refreshRate={150}
                         onResize={() => {
                           window.dispatchEvent(new Event('resize'));
                         }} />
  )
}
