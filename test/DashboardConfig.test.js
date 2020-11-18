import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { generalMocks, setToken } from './RTLUtils';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import userEvent from '@testing-library/user-event';
import PodMockResponse from '../__mocks__/pod.json';
import DashboardConfig from '../__mocks__/dashboardconf.json';
import CRDmockResponse from '../__mocks__/crd_fetch_long.json';

fetchMock.enableMocks();

async function setup() {
  setToken();
  window.history.pushState({}, 'Page Title', '/api/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9');

  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
}

beforeEach(() => { localStorage.setItem('theme', 'dark');
  Cookies.remove('token');
});

function mocks(){
  fetch.mockResponse(req => {
    if (req.url === 'http://localhost:3001/clustercustomobject/dashboardconfigs') {
      if(req.method === 'GET')
        return Promise.resolve(new Response(JSON.stringify({body: {items: []}})));
      else if(req.method === 'POST'){
        return Promise.resolve(new Response(JSON.stringify({body: DashboardConfig.items[0]})));
      }
    }
    else if(generalMocks(req.url))
      return generalMocks(req.url);
  })
}

describe('DashboardConfig', () => {
  test('Dashboard config create when there is none', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();

    expect(window.api.dashConfigs.current).not.toBeNull();
  })

  test('Dashboard config update works', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();

    let apiManager = window.api.apiManager.current;

    let dashConf = DashboardConfig.items[0];

    dashConf.metadata.resourceVersion += 1;

    await act(async () => {
      apiManager.sendModifiedSignal('dashboardconfigs/', dashConf);
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.findByText('Dashboard Config modified'));
  })

  test('Dashboard config delete generate a new config', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();

    let apiManager = window.api.apiManager.current;

    let dashConf = DashboardConfig;

    dashConf.metadata.resourceVersion += 1;

    await act(async () => {
      apiManager.sendDeletedSignal('dashboardconfigs/', dashConf);
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(window.api.dashConfigs.current).not.toBeNull();
  })
})
