import React from 'react';

export default function DraggableWrapper(props){
  return (
    <div className={props.dragHandle ? props.dragHandle : 'draggable'}>
      {props.children}
    </div>
  )
}
