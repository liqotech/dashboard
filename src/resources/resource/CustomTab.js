import { Menu, Dropdown, Alert, Card } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import './CustomTab.css'
import CustomTabContent from './CustomTabContent';
import _ from 'lodash';
import { pruneLayout } from '../common/LayoutUtils';
import { getResourceConfig, updateResourceConfig } from '../common/DashboardConfigUtils';
import { useParams, useLocation } from 'react-router-dom';
import {PlusOutlined} from '@ant-design/icons';
import Measure from 'react-measure';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function CustomTab(props){
  const [cardList, setCardList] = useState(props.content.map(x => {
    return {...x, autoSize: true}
  }));
  const cardListResized = useRef(props.content.map(x => {
    return {cardTitle: x.cardTitle, cardLayout: {}}
  }))
  const [layoutsRef, setLayoutsRef] = useState({lg: []});
  let location = props._location ? props._location : useLocation();
  let params = props._params ? props._params : useParams();
  const layoutRef = useRef([]);

  useEffect(() => {
    setCardList(props.content.map(x => {
      let tmp = cardList.find(item => item.cardTitle === x.cardTitle)
      if(!tmp){
        tmp = cardList.find(item => _.isEqual(item.cardContent, x.cardContent))
        if(tmp){
          layoutRef.current.find(item => item.i === tmp.cardTitle).i = x.cardTitle;
          cardListResized.current.find(item =>item.cardTitle === tmp.cardTitle).cardTitle = x.cardTitle;
        }
      }
      return {...x, autoSize: tmp ? tmp.autoSize : false}
    }));
  }, [props.content])

  useEffect(() => {
    setLayoutsRef(prev => {
      prev.lg = layoutRef.current
      return JSON.parse(JSON.stringify(prev));
    });
  }, [layoutRef.current])

  const onDeleteContent = (cardName) => {
    let tempResourceConfig = getResourceConfig(params, location);
    tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle)
      .tabContent =
      tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle)
        .tabContent.filter(item => item.cardTitle !== cardName);

    updateResourceConfig(tempResourceConfig, params, location);
  }

  const onAddContent = (kind) => {
    let key = cardList.filter(item => item.cardTitle.includes('New ' + kind + ' #')).length;
    let newCard = {
      cardContent: null,
      cardDisplay: kind,
      cardTitle: 'New ' + kind + ' #' + key,
      cardLayout: {
        x: 0,
        y: 500,
        w: 6,
        h: 13
      }
    }

    let tempResourceConfig = getResourceConfig(params, location);
    tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle).tabContent.push(newCard);
    updateResourceConfig(tempResourceConfig, params, location);
  }

  const menu = (
    <Menu>
      <Menu.Item key="add_list"
                 onClick={() => onAddContent('List')}
                 icon={<PlusOutlined />}
      >
        Add List</Menu.Item>
      <Menu.Item key="add_table"
                 onClick={() => onAddContent('Table')}
                 icon={<PlusOutlined />}
      >
        Add Table
      </Menu.Item>
      <Menu.Item key="add_ref"
                 onClick={() => onAddContent('Ref')}
                 icon={<PlusOutlined />}
      >
        Add Reference
      </Menu.Item>
    </Menu>
  );

  const onLayoutChange = (layout, layouts) => {
    layoutRef.current = [...layout];

    /** If a content card is deleted or created, don't save on change of layout,
     * but wait for the confirmation and then it is deleted automatically
     * by the props change
     */
    if(layout.length !== props.content.length)
      return;

    let tabLayout = [];

    let content = props.content.map(x => {
      return {...x, autoSize: cardList.find(item => item.cardTitle === x.cardTitle).autoSize}
    });

    content.forEach(card => {
      tabLayout.push({
        ...card.cardLayout,
        i: card.cardTitle
      })
    })

    let layoutPruned = pruneLayout(JSON.parse(JSON.stringify(layout)));

    if(content && !_.isEqual(layoutPruned, tabLayout)){
      layoutPruned.forEach(card => {
        if(content.find(item => item.cardTitle === card.i))
          content.find(item => item.cardTitle === card.i).cardLayout = card;
      })

      setCardList([...content]);

      if(layouts){
        let tempResourceConfig = getResourceConfig(params, location);
        tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle).tabContent.forEach(card => {
          let newCard = content.find(item => item.cardTitle === card.cardTitle);
          if(!newCard.autoSize)
            card.cardLayout = newCard.cardLayout;
        });
        updateResourceConfig(tempResourceConfig, params, location);
      }
    } else if(!layouts){
      setCardList([...content]);
    }
  }

  const onResize = card => {
    if(layoutRef.current.length > 0 && card.autoSize &&
      cardListResized.current.find(item => item.cardTitle === card.cardTitle) &&
      cardListResized.current.find(item => item.cardTitle === card.cardTitle).cardLayout.h !== card.cardLayout.h
    ) {
      layoutRef.current.find(item => item.i === card.cardTitle).h = cardListResized.current.find(item => item.cardTitle === card.cardTitle).cardLayout.h;
      layoutRef.current.find(item => item.i === card.cardTitle).isResizable = false;
      onLayoutChange(layoutRef.current);
    }
  }

  let cards = [];
  cardList.forEach(card => {
    if(layoutRef.current.length > 0 && !card.autoSize &&
      props.content.find(item => item.cardTitle === card.cardTitle) &&
      card.cardLayout.h !== props.content.find(item => item.cardTitle === card.cardTitle).cardLayout.h
    ){
      card.cardLayout = props.content.find(item => item.cardTitle === card.cardTitle).cardLayout;
      layoutRef.current.find(item => item.i === card.cardTitle).h = card.cardLayout ? card.cardLayout.h : 15;
      layoutRef.current.find(item => item.i === card.cardTitle).isResizable = true;
      onLayoutChange(layoutRef.current)
    }

    cards.push(
      <div data-grid={{
             w: card.cardLayout ? card.cardLayout.w : 6,
             h: card.cardLayout ? card.cardLayout.h : 15,
             x: card.cardLayout ? card.cardLayout.x : 0,
             y: card.cardLayout ? card.cardLayout.y : 0,
             isResizable: !card.autoSize
           }}
           key={card.cardTitle}
           style={{boxShadow: '0 2px 8px #f0f1f2', overflow: 'hidden'}}
      >
        <div>
          <Measure
            bounds
            onResize={contentRect => {
              if(cardListResized.current.find(item => item.cardTitle === card.cardTitle)){
                cardListResized.current.find(item => item.cardTitle === card.cardTitle).cardLayout = {
                  ...card.cardLayout,
                  h: Math.round(contentRect.bounds.height / 16)
                }
                onResize(card);
              }
            }}
          >
            {({ measureRef }) => (
              <div ref={measureRef}>
                <CustomTabContent cardContent={card.cardContent}
                                  cardDisplay={card.cardDisplay}
                                  cardTitle={card.cardTitle}
                                  autoSize={card.autoSize}
                                  setCardList={setCardList}
                                  {...props}
                                  onDeleteContent={onDeleteContent}

                />
              </div>
            )}
          </Measure>
        </div>
      </div>
    )

    onResize(card);
  })

  return(
    <div>
      <Dropdown overlay={menu} trigger={['contextMenu']}>
        <Card style={{overflowY: 'auto', overflowX: 'hidden'}}
              bodyStyle={{padding: 0, minHeight: '72vh'}}
        >
          {!props.content.length < 0 ? (
            <Alert
              closable
              message="Nothing to show here..."
              description="Try adding something."
              type="info"
              showIcon
            />
          ) : (
            <div>
              <ResponsiveGridLayout className="react-grid-layout" margin={[16, 16]}
                                    layouts={layoutsRef}
                                    breakpoints={{lg: 1000, md: 796, sm: 568, xs: 280, xxs: 0}}
                                    cols={{lg: 12, md: 6, sm: 4, xs: 2, xxs: 1}}
                                    rowHeight={1} onLayoutChange={onLayoutChange}
                                    compactType={'vertical'} isBounded
                                    draggableHandle={'.draggable'}
              >
                {cards}
              </ResponsiveGridLayout>
            </div>
          )}
        </Card>
      </Dropdown>
    </div>
  )
}
