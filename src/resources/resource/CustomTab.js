import { Menu, Dropdown, Alert, Card } from 'antd';
import React, { useEffect, useState } from 'react';
import 'react-resizable/css/styles.css';
import { Responsive, WidthProvider } from 'react-grid-layout';
import './CustomTab.css'
import CustomTabContent from './CustomTabContent';
import _ from 'lodash';
import { pruneLayout } from '../common/LayoutUtils';
import { getResourceConfig, updateResourceConfig } from '../common/DashboardConfigUtils';
import { useParams, useLocation } from 'react-router-dom';
import {PlusOutlined} from '@ant-design/icons';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function CustomTab(props){
  const [cardList, setCardList] = useState(props.content);
  let params = useParams();
  let location = useLocation();

  useEffect(() => {
    setCardList([...props.content]);
  }, [props.content])

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

  const onLayoutChange = layout => {
    /** If a content card is deleted or created, don't save on change of layout,
     * but wait for the confirmation and then it is deleted automatically
     * by the props change
     */
    if(layout.length !== props.content.length)
      return;

    let tabLayout = [];
    let counter = 0;
    props.content.forEach(card => {
      tabLayout.push({
        ...card.cardLayout,
        i: card.cardTitle
      })
      counter++;
    })

    let layoutPruned = pruneLayout(JSON.parse(JSON.stringify(layout)));

    if(props.content && !_.isEqual(layoutPruned, tabLayout)){
      layoutPruned.forEach(card => {
        if(props.content.find(item => item.cardTitle === card.i))
          props.content.find(item => item.cardTitle === card.i).cardLayout = card;
      })

      let tempResourceConfig = getResourceConfig(params, location);
      tempResourceConfig.render.tabs.find(item => item.tabTitle === props.tabTitle).tabContent = props.content;
      updateResourceConfig(tempResourceConfig, params, location);
    }
  }

  let cards = [];
  cardList.forEach(card => {
    cards.push(
      <div data-grid={{
             w: card.cardLayout ? card.cardLayout.w : 6,
             h: card.cardLayout ? card.cardLayout.h : 15,
             x: card.cardLayout ? card.cardLayout.x : 0,
             y: card.cardLayout ? card.cardLayout.y : 0
           }}
           key={card.cardTitle}
           style={{boxShadow: '0 2px 8px #f0f1f2'}}
      >
        <CustomTabContent cardContent={card.cardContent}
                          cardDisplay={card.cardDisplay}
                          cardTitle={card.cardTitle}
                          {...props}
                          onDeleteContent={onDeleteContent}
        />
      </div>
    )
  })

  return(
    <div>
      <Dropdown overlay={menu} trigger={['contextMenu']}>
        <Card style={{overflow: 'auto'}}
              bodyStyle={{paddingLeft: 16, paddingRight: 16, minHeight: '72vh'}}
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
