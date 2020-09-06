import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { render, screen } from '@testing-library/react';
import ViewMockResponse from '../__mocks__/views.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import FCMockResponseNoIn from '../__mocks__/foreigncluster_noIncoming.json';
import FCMockResponseNoOut from '../__mocks__/foreigncluster_noOutgoing.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import Error409 from '../__mocks__/409.json';
import PodsMockResponse from '../__mocks__/pods.json';
import userEvent from '@testing-library/user-event';
import NodesMockResponse from '../__mocks__/nodes.json';
import NodesMetricsMockResponse from '../__mocks__/nodes_metrics.json';
import { metricsPODs } from './RTLUtils';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

let api;

async function setup() {
  api = new ApiManager();
  api.getCRDs().then(async () => {
    render(
      <MemoryRouter>
        <Home api={api} />
      </MemoryRouter>
    )
  });
}

function mocks(advertisement, foreignCluster, peeringRequest, error, podsError) {
  fetch.mockResponse((req) => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      if(req.method === 'GET')
        return Promise.resolve(new Response(JSON.stringify({ body: foreignCluster })));
      else{
        if(!error){
          foreignCluster = foreignCluster.items[0];
          foreignCluster.metadata.resourceVersion++;
          foreignCluster.spec.join = false;
          return Promise.resolve(new Response(JSON.stringify({ body: foreignCluster })));
        } else {
          return Promise.reject(Error409.body);
        }
      }
    } else if (req.url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: advertisement })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return Promise.resolve(new Response(JSON.stringify({ body: peeringRequest })));
    } else if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return Promise.resolve(new Response(JSON.stringify({ body: ConfigMockResponse })));
    } else if (req.url === 'http://localhost:3001/pod') {
      if(podsError)
        return Promise.reject(Error409.body);
      else
        return Promise.resolve(new Response(JSON.stringify({body: PodsMockResponse})));
    } else if (req.url === 'http://localhost:3001/nodes') {
      return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
    } else if (req.url === 'http://localhost:3001/metrics/nodes') {
      return Promise.resolve(new Response(JSON.stringify(NodesMetricsMockResponse)));
    } else {
      return metricsPODs(req);
    }
  })
}

async function OKCheck() {
  await setup();

  expect(await screen.findByText('8d73c01a-f23a-45dc-822b-7d3232683f53')).toBeInTheDocument();
  expect(await screen.findByText('No peer available at the moment')).toBeInTheDocument();

  userEvent.click(screen.getByLabelText('ellipsis'));

  userEvent.click(await screen.findByLabelText('snippets'));

  expect(await screen.findByText('General')).toBeInTheDocument();

  let home = await screen.findAllByText('Home');

  userEvent.click(home[1]);

  expect(await screen.findAllByText(/POD/i)).toHaveLength(2);
}

async function sort(){
  expect(screen.getAllByText(/hello/i)).toHaveLength(2);

  userEvent.click(screen.getAllByLabelText('search')[0]);

  const search = await screen.findByRole('textbox');

  await userEvent.type(search, 'c7qzv');
}

describe('ConnectionDetails', () => {

  test('Detail button works (out and in)', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('Detail button works (only out)', async () => {
    mocks(AdvMockResponse, FCMockResponseNoIn, PRMockResponse);

    await setup();

    expect(await screen.findByText('8d73c01a-f23a-45dc-822b-7d3232683f53')).toBeInTheDocument();
    expect(await screen.findByText('No peer available at the moment')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('ellipsis'));

    userEvent.click(await screen.findByLabelText('snippets'));

    expect(await screen.findByText('General')).toBeInTheDocument();

    userEvent.click(await screen.findByText('Foreign'));

    expect(await screen.findAllByText(/POD/i)).toHaveLength(2);
  }, testTimeout)

  test('Detail button works (only in)', async () => {
    mocks(AdvMockResponse, FCMockResponseNoOut, PRMockResponse);

    await OKCheck();
  }, testTimeout)

  test('Search pods works (click)', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    await sort();

    const searchButton = await screen.findByText('Search');

    userEvent.click(searchButton);

    expect(screen.getAllByText(/hello/i)).toHaveLength(1);
  }, testTimeout)

  test('Search pods works (enter)', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    await sort();

    await userEvent.type(screen.getByRole('textbox'), '{enter}');

    expect(screen.getAllByText(/hello/i)).toHaveLength(1);
  }, testTimeout)

  test('Search reset pods works', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    await sort();

    const resetButton = await screen.findByText('Reset');

    userEvent.click(resetButton);

    expect(screen.getAllByText(/hello/i)).toHaveLength(2);
  }, testTimeout)

  test('Sorting pods works and close modal', async () => {
    mocks(AdvMockResponse, FCMockResponse, PRMockResponse);

    await OKCheck();

    userEvent.click(screen.getByText('CPU (%)'));

    userEvent.click(screen.getByText('RAM (%)'));

    let close = await screen.findAllByLabelText('close');

    userEvent.click(close[2]);

    setTimeout(() => {
      expect(screen.queryByText('Foreign Cluster')).not.toBeInTheDocument();
    }, 1500);

    userEvent.click(await screen.findByLabelText('plus'));
  }, 60000)
})
