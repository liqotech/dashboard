import React, { useEffect, useRef, useState } from 'react';
import { Alert, Card } from 'antd';
import GridLayout from 'react-grid-layout';
import DraggableWrapper from '../../common/DraggableWrapper';
import { pruneLayout } from '../../resources/common/LayoutUtils';
import _ from 'lodash';
import { resizeDetector } from '../../customView/CustomViewUtils';
import Measure from 'react-measure';

export default function DraggableLayout(props) {
  const [items, setItems] = useState([]);
  const [width, setWidth] = useState(1000);
  const [breakpoint, setBreakpoint] = useState('lg');
  let headerSize = props.headerSmall ? 36 : 46;
  let defaultLayout = {
    lg: { x: 0, y: 0, h: 20, w: 24 },
    md: { x: 0, y: 0, h: 20, w: 24 },
    sm: { x: 0, y: 0, h: 20, w: 24 },
    xs: { x: 0, y: 0, h: 20, w: 24 },
    xxs: { x: 0, y: 0, h: 20, w: 24 }
  };
  const [layoutsRef, setLayoutsRef] = useState([]);

  const onResize = (child, h, layout) => {
    if (h < layout.minH) h = layout.minH;

    setLayoutsRef(prev => {
      let itemLayout = prev.find(i => i.i === 'draggable_item_' + child);
      if (itemLayout) {
        itemLayout.w = layout.w;
        itemLayout.x = layout.x;
        itemLayout.y = layout.y;
        itemLayout.h = h;
      } else {
        let item = {
          ...layout,
          h: h,
          i: 'draggable_item_' + child
        };
        prev.push(item);
      }
      return JSON.parse(JSON.stringify(prev));
    });

    setLayoutsRef(prev => {
      return JSON.parse(JSON.stringify(prev));
    });
  };

  useEffect(() => {
    setItems([]);
    props.children.forEach(child => {
      if (
        child.props['data-grid'] &&
        child.props['data-grid'].w &&
        !child.props['data-grid'][breakpoint]
      ) {
        let isResizable = true;

        if (
          typeof child.props['data-grid'].isResizable !== 'undefined' &&
          !child.props['data-grid'].isResizable
        )
          isResizable = false;

        child.props['data-grid'][breakpoint] = {
          w: child.props['data-grid'].w,
          h: child.props['data-grid'].h,
          x: child.props['data-grid'].x,
          y: child.props['data-grid'].y,
          minH: child.props['data-grid'].minH,
          isResizable: isResizable
        };
      }
      let layout =
        child.props['data-grid'] &&
        !_.isEmpty(child.props['data-grid'][breakpoint])
          ? child.props['data-grid'][breakpoint]
          : defaultLayout[breakpoint];

      if (
        layoutsRef.find(i => i.i === 'draggable_item_' + child.key) &&
        layout.w !==
          layoutsRef.find(i => i.i === 'draggable_item_' + child.key).w
      )
        onResize(child.key, layout.h, layout);

      let height = -1;

      setItems(prev => [
        ...prev,
        <div
          key={'draggable_item_' + child.key}
          data-grid={layout}
          style={{ overflow: 'hidden' }}
          className={'ant-card'}
        >
          <Alert.ErrorBoundary>
            <Measure
              bounds
              onResize={contentRect => {
                if (props.responsive) {
                  let h = Math.round(contentRect.bounds.height / 10 - 1);
                  onResize(child.key, h, layout);
                }
              }}
            >
              {({ measureRef }) => (
                <div ref={measureRef}>
                  <div>
                    <Card
                      title={
                        <DraggableWrapper dragHandle={'draggable-layout'}>
                          {child.props.title}
                        </DraggableWrapper>
                      }
                      extra={child.props.extra ? child.props.extra : []}
                      size={props.headerSmall ? 'small' : 'default'}
                      style={{
                        overflowY: 'auto',
                        height: '100%',
                        overflowX: 'hidden'
                      }}
                      headStyle={{
                        position: 'fixed',
                        zIndex: 20,
                        width: '100%'
                      }}
                      bodyStyle={{
                        height: '100%',
                        position: 'relative',
                        padding: 0,
                        marginLeft: -1,
                        marginRight: -1
                      }}
                      bordered={false}
                    >
                      <div
                        style={{
                          marginTop: headerSize,
                          height: 'calc(100% - ' + headerSize + 'px)',
                          position: 'relative'
                        }}
                      >
                        {child.length === 0 ? (
                          <Alert
                            closable
                            message="Nothing to show here..."
                            type="info"
                            showIcon
                          />
                        ) : (
                          child
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </Measure>
          </Alert.ErrorBoundary>
        </div>
      ]);
    });
  }, [breakpoint, props.children]);

  const onLayoutChange = layout => {
    /** If a content card is deleted or created, don't save on change of layout,
     * but wait for the confirmation and then it is deleted automatically
     * by the props change
     */
    if (layout.length !== props.children.length) return;

    let prevLayout = [];
    let counter = 0;
    props.children.forEach(child => {
      prevLayout.push({
        ...(child.props['data-grid'] &&
        !_.isEmpty(child.props['data-grid']) &&
        child.props['data-grid'][breakpoint]
          ? child.props['data-grid'][breakpoint]
          : {}),
        i: 'draggable_item_' + child.key
      });
      counter++;
    });

    let layoutPruned = pruneLayout(JSON.parse(JSON.stringify(layout)));

    if (props.children && !_.isEqual(layoutPruned, prevLayout)) {
      layoutPruned.forEach(child => {
        if (
          props.children.find(
            item => 'draggable_item_' + item.key === child.i
          ) &&
          props.customView.spec.resources.find(
            res => 'draggable_item_' + res.resourcePath === child.i
          )
        ) {
          if (
            !props.customView.spec.resources.find(
              res => 'draggable_item_' + res.resourcePath === child.i
            ).layout
          )
            props.customView.spec.resources.find(
              res => 'draggable_item_' + res.resourcePath === child.i
            ).layout = {};
          props.customView.spec.resources.find(
            res => 'draggable_item_' + res.resourcePath === child.i
          ).layout[breakpoint] = child;
        }
      });

      let array = props.customView.metadata.selfLink.split('/');
      window.api
        .updateCustomResource(
          array[2],
          array[3],
          props.customView.metadata.namespace,
          array[6],
          props.customView.metadata.name,
          props.customView
        )
        .then(res => {
          props.customView.metadata = res.body.metadata;
        })
        .catch(error => console.error(error));
    }
  };

  return (
    <div style={{ margin: -10 }}>
      {resizeDetector(setWidth, setBreakpoint, props.breakpoints)}
      <GridLayout
        className="react-grid-layout"
        margin={[10, 10]}
        layout={layoutsRef}
        cols={24}
        width={width}
        compactType={'vertical'}
        rowHeight={1}
        draggableHandle={'.draggable-layout'}
        onResizeStop={layout => {
          setLayoutsRef(prev => {
            prev = JSON.parse(JSON.stringify(layout));
            return prev;
          });
        }}
        onLayoutChange={props.saveOnLayoutChange ? onLayoutChange : () => {}}
      >
        {items}
      </GridLayout>
    </div>
  );
}
