import React from 'react';

export default function DraggableWrapper({children}){
  return (
    <div className={'draggable'}>
      {children}
    </div>
  )
}
