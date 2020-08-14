import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import React from 'react';
import userEvent from '@testing-library/user-event';
import AdvMockResponse from '../__mocks__/advertisement.json';
import TunnMockResponse from '../__mocks__/tunnelendpoints.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import HistoMockResponse from '../__mocks__/histocharts.json';
import LiqoDashNewMockResponse from '../__mocks__/liqodashtest_new.json';
import LiqoDashUpdatedMockResponse from '../__mocks__/liqodashtest_update.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import FCMockNew from '../__mocks__/foreigncluster_new.json';
import PRMockResponse from '../__mocks__/peeringrequest.json';
import ConfigMockResponse from '../__mocks__/configs.json';
import ConfigMockResponseUpdated from '../__mocks__/configs_updated.json';
import Error409 from '../__mocks__/409.json';
import Error401 from '../__mocks__/401.json';
import Error404 from '../__mocks__/404.json';

export function setup_login() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}

export function generalHomeGET(url) {
  if (url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
    return Promise.resolve(new Response(JSON.stringify({body: FCMockResponse})));
  } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
    return Promise.resolve(new Response(JSON.stringify({body: AdvMockResponse})));
  } else if (url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
    return Promise.resolve(new Response(JSON.stringify({body: PRMockResponse})));
  } else if (url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
    return Promise.resolve(new Response(JSON.stringify({body: ConfigMockResponse})));
  }
}

function responseManager(req, error, method, crd, crd_v, res_get, res_post, res_put){
  if (req.method === 'GET') {
    return Promise.resolve(new Response(JSON.stringify({ body: res_get })));
  } else if (req.method === 'POST') {
    if (error && method === 'POST') {
      if (error === '409') {
        return Promise.reject(Error409.body);
      } else {
        return Promise.reject(Error401.body);
      }
    } else {
      return Promise.resolve(new Response(JSON.stringify({ body: res_post })));
    }
  } else if (req.method === 'PUT') {
    if (error && method === 'PUT') {
      if (error === '409') {
        return Promise.reject(Error409.body);
      } else {
        return Promise.reject(Error401.body);
      }
    } else {
      return Promise.resolve(new Response(JSON.stringify({ body: res_put })));
    }
  } else if (req.method === 'DELETE') {
    if (error && method === 'DELETE') {
      return Promise.reject(Error404.body);
    } else {
      return Promise.resolve(new Response(JSON.stringify(res_get.items[0])));
    }
  }
}

export function mockCRDAndViewsExtended(error, method, crd) {
  fetch.mockResponse(req => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    }  else if (req.url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return responseManager(req, error, method, crd, 'liqodashtests',
        LiqoDashMockResponse, LiqoDashNewMockResponse, LiqoDashUpdatedMockResponse);
    } else if (req.url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/histocharts') {
      return Promise.resolve(new Response(JSON.stringify({body: HistoMockResponse })))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      return responseManager(req, error, method, crd, 'foreignclusters',
        FCMockResponse, FCMockNew, null);
    } else if (req.url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return responseManager(req, error, method, crd, 'advertisements',
        AdvMockResponse, null, null);
    } else if (req.url === 'http://localhost:3001/clustercustomobject/peeringrequests') {
      return responseManager(req, error, method, crd, 'peeringrequests',
        PRMockResponse, null, null);
    } else if (req.url === 'http://localhost:3001/clustercustomobject/clusterconfigs') {
      return responseManager(req, error, method, crd, 'clusterconfigs',
        ConfigMockResponse, null, ConfigMockResponseUpdated);
    }
  })
}

export const loginTest = async () => {
  setup_login();

  /** Input mock password */
  const tokenInput = screen.getByLabelText('lab');
  userEvent.type(tokenInput, 'password');

  /** Click on login button */
  const submitButton = screen.getByRole('button');
  userEvent.click(submitButton);

  /** Assert that the redirected page is the home page */
  expect(await screen.findByText('LIQO')).toBeInTheDocument();

}

export async function setup_resource(error, method, crd) {
  mockCRDAndViewsExtended(error, method, crd);
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  userEvent.click(await screen.findByText('LiqoDashTest'));

  await screen.findByLabelText('plus');
}

export async function setup_cv(view) {
  if(!view){
    view = ViewMockResponse;
  }
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: view })))
    } else if (url === 'http://localhost:3001/clustercustomobject/tunnelendpoints') {
      return Promise.resolve(new Response(JSON.stringify({ body: TunnMockResponse })))
    } else {
      return generalHomeGET(url);
    }
  })

  await loginTest();

  const customview = await screen.findByText('Liqo View');
  userEvent.click(customview);
}
