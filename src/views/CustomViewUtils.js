import ReactResizeDetector from 'react-resize-detector';
import React from 'react';

export function onDrag(layout, oldLayoutItem, layoutItem, _this){
  if(JSON.stringify(oldLayoutItem) !== JSON.stringify(layoutItem)){
    let CRDs = _this.state.CRDs;
    CRDs.forEach(CRD => {
      let l = layout.find(item => {return item.i === CRD.metadata.name});
      CRD.x = l.x;
      CRD.y = l.y;
    })

    _this.state.layout[_this.state.newBr] = layout;
    _this.state.CRDs = CRDs;
  }
}

export function onResize(layout, oldLayoutItem, layoutItem, _this) {
  if(!oldLayoutItem) return;
  let CRDs = _this.state.CRDs;
  let index = CRDs.indexOf(CRDs.find(item => {return item.metadata.name === layoutItem.i}));

  /** When changing width */
  if(oldLayoutItem.w !== layoutItem.w){
    CRDs[index].width = layoutItem.w;
    _this.state.CRDs = CRDs;
  }
  /** When changing height */
  if(oldLayoutItem.h !== layoutItem.h){
    CRDs[index].height = layoutItem.h;
    _this.state.CRDs = CRDs;
  }

  _this.state.layout[_this.state.newBr] = layout;
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
