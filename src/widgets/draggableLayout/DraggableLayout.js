import React, { useEffect, useState } from 'react';
import { Alert, Card } from 'antd';
import GridLayout from 'react-grid-layout';
import DraggableWrapper from '../../common/DraggableWrapper';
import { pruneLayout } from '../../resources/common/LayoutUtils';
import _ from 'lodash';
import { resizeDetector } from '../../views/CustomViewUtils';

export default function DraggableLayout(props){
  const [items, setItems] = useState([]);
  const [width, setWidth] = useState(1000);
  const [breakpoint, setBreakpoint] = useState('lg');
  let headerSize = props.headerSmall ? 36 : 46;
  let defaultLayout = {
    lg: {x: 0, y: 0, h: 20, w: 24},
    md: {x: 0, y: 0, h: 20, w: 10},
    sm: {x: 0, y: 0, h: 20, w: 10},
    xs: {x: 0, y: 0, h: 20, w: 10},
    xxs: {x: 0, y: 0, h: 20, w: 10}
  }

  useEffect(() => {
    setItems([]);
    props.children.forEach(child => {
      if(child.props['data-grid'] && child.props['data-grid'].w){
        child.props['data-grid'][breakpoint] = child.props['data-grid'];
      }
      //console.log(child.props['data-grid'])
      let layout = (child.props['data-grid'] && !_.isEmpty(child.props['data-grid'][breakpoint])) ?
        child.props['data-grid'][breakpoint] : defaultLayout[breakpoint];
      setItems(prev => [...prev,
        (
          <div key={'draggable_item_' + child.key} data-grid={layout} >
            <Alert.ErrorBoundary>
              <Card title={
                <DraggableWrapper dragHandle={'draggable-layout'}>
                  {child.props.title}
                </DraggableWrapper>
              }
                    extra={child.props.extra ? child.props.extra : []}
                    size={props.headerSmall ? 'small' : 'default'}
                    //type={'inner'}
                    style={{overflowY: 'auto', height: '100%', overflowX: 'hidden'}}
                    headStyle={{position: 'fixed', zIndex: 20, width: '100%'}}
                    bodyStyle={{height: '100%', position: 'relative', padding: 0, marginLeft: -1, marginRight: -1}}
                    className={'scrollbar'}
                    bordered={false}
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
      ])
    })
  }, [breakpoint, props.children]);

  const onLayoutChange = layout => {
    /** If a content card is deleted or created, don't save on change of layout,
     * but wait for the confirmation and then it is deleted automatically
     * by the props change
     */
    if(layout.length !== props.children.length)
      return;

    let prevLayout = [];
    let counter = 0;
    props.children.forEach(child => {
      prevLayout.push({
        ...child.props['data-grid'][breakpoint],
        i: 'draggable_item_' + child.key
      })
      counter++;
    })

    let layoutPruned = pruneLayout(JSON.parse(JSON.stringify(layout)));

    if(props.children && !_.isEqual(layoutPruned, prevLayout)){
      layoutPruned.forEach(child => {
        if(props.children.find(item => 'draggable_item_' + item.key === child.i)){
          props.customView.spec.resources.find(res => 'draggable_item_' + res.resourcePath === child.i).layout[breakpoint] = child;
        }
      })

      let array = props.customView.metadata.selfLink.split('/');
      window.api.updateCustomResource(
        array[2],
        array[3],
        props.customView.metadata.namespace,
        array[6],
        props.customView.metadata.name,
        props.customView
      ).catch(error => console.log(error))
    }
  }

  return(
    <div style={{margin: -10}}>
      {resizeDetector(setWidth, setBreakpoint)}
      <GridLayout className="react-grid-layout" margin={[10, 10]}
                  cols={24}
                  width={width}
                  compactType={'vertical'} rowHeight={10}
                  draggableHandle={'.draggable-layout'}
                  onLayoutChange={props.saveOnLayoutChange ? onLayoutChange : () => {}}
      >
        {items}
      </GridLayout>
    </div>
  )
}
