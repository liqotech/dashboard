import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import Home from '../src/home/Home';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import AdvMockResponse from '../__mocks__/advertisement.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import Error404 from '../__mocks__/404.json';
import App from '../src/app/App';
import ViewMockResponse from '../__mocks__/views.json';

fetchMock.enableMocks();

let api;

async function setup() {
  window.APISERVER_URL = true;
  window.OIDC_PROVIDER_URL = 'test-url';
  window.OIDC_CLIENT_ID = 'test-id';

  api = new ApiManager();
  api.getCRDs().then(async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )
  });
}

function mocks(){
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      return Promise.resolve(new Response(JSON.stringify({body: FCMockResponse})));
    } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({body: AdvMockResponse})));
    } else if (url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return Promise.resolve(new Response(JSON.stringify({body: PRMockResponse})));
    } else if (url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return Promise.reject(Error404.body);
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
    }
  })
}

describe('App', () => {
  test('OIDC', async () => {
    mocks();

    await setup();

    /** Assert that a success notification has spawned */
    expect(await screen.findByText(/liqo/i)).toBeInTheDocument();
  })
})
