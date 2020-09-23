import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { act, render, screen } from '@testing-library/react';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import { testTimeout } from '../src/constants';
import CMMockResponse from '../__mocks__/configmap_clusterID.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import LiqoHeader from '../src/home/LiqoHeader';
import userEvent from '@testing-library/user-event';

fetchMock.enableMocks();

async function setup() {
  window.api = new ApiManager({id_token: 'test'});
  return render(
      <MemoryRouter>
        <LiqoHeader config={ConfigMockResponse.items[0]} />
      </MemoryRouter>
    )
}

function mocks(error){
  fetch.mockResponse(req => {
    if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      if(req.method === 'PUT'){
        if(!error){
          let config = ConfigMockResponse;
          config.items[0].spec.discoveryConfig.clusterName = 'My cluster';
          return Promise.resolve(new Response(JSON.stringify({body: config})));
        } else
          return Promise.reject();
      }
      else
        return Promise.resolve(new Response(JSON.stringify({body: ConfigMockResponse})));
    } else if (req.url === 'http://localhost:3001/configmaps/liqo') {
      return Promise.resolve(new Response(JSON.stringify({body: CMMockResponse})));
    }
  })
}

async function changeClusterName(){
  await setup();

  const clusterName = await screen.findByText('LIQO');
  const clusterID = await screen.findByText('10e3e821-8194-4fb1-856f-d917d2fc54c0');

  expect(clusterName).toBeInTheDocument();
  expect(clusterID).toBeInTheDocument();

  userEvent.click(clusterName);
  await userEvent.type(await screen.findByRole('textbox'),
    '{backspace}{backspace}{backspace}{backspace}My cluster');
  userEvent.click(clusterID);
}

describe('LiqoHeader', () => {
  test('Error on saving clusterName', async () => {
    mocks(true);

    await changeClusterName();

    expect(await screen.findByText('LIQO')).toBeInTheDocument();

  }, testTimeout)

  test('The header shows the cluster name and cluster ID', async () => {
    mocks();

    await changeClusterName();

    expect(await screen.findByText('My cluster')).toBeInTheDocument();
    expect(await screen.queryByText('LIQO')).not.toBeInTheDocument();

  }, testTimeout)
})
