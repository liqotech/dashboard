import React, { useEffect, useState } from 'react';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Alert, Card, Input, Tooltip } from 'antd';
import DraggableWrapper from '../../common/DraggableWrapper';
import { CloseOutlined, EditOutlined, LoadingOutlined } from '@ant-design/icons';
const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DraggableLayout(props){
  let items = [];
  let headerSize = props.headerSmall ? 36 : 46;

  props.children.forEach(child => {
    items.push(
      <div key={'draggable_item_' + child.key} data-grid={child.props['data-grid']} >
        <Alert.ErrorBoundary>
          <Card title={
                  <DraggableWrapper>
                    {child.props.title}
                  </DraggableWrapper>
                }
                size={props.headerSmall ? 'small' : 'default'}
                type={'inner'}
                style={{overflowY: 'auto', height: '100%', overflowX: 'hidden', backgroundColor: '#fff'}}
                headStyle={{position: 'fixed', zIndex: 20, width: '100%'}}
                bodyStyle={{height: '100%', position: 'relative', padding: 0}}
                className={'scrollbar'}
          >
            <div style={{marginTop: headerSize, height: 'calc(100% - ' + headerSize + 'px)', position: 'relative'}}>
              {child.length === 0 ? (
                <Alert
                  closable
                  message="Nothing to show here..."
                  type="info"
                  showIcon
                />
              ) : child}
            </div>
          </Card>
        </Alert.ErrorBoundary>
      </div>
    )
  })

  return(
    <ResponsiveGridLayout className="react-grid-layout" margin={[10, 10]}
                          breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                          cols={{lg: 24, md: 12, sm: 8, xs: 4, xxs: 2}}
                          compactType={'vertical'} rowHeight={10}
                          draggableHandle={'.draggable'}
    >
      {items}
    </ResponsiveGridLayout>
  )
}
