import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../../app/App';
import CRDmockResponse from '../../../__mocks__/crd_fetch.json';
import ViewMockResponse from '../../../__mocks__/views.json';
import React from 'react';
import userEvent from '@testing-library/user-event';
import AdvMockResponse from '../../../__mocks__/advertisement.json';
import TunnMockResponse from '../../../__mocks__/tunnelendpoints.json';
import LiqoDashMockResponse from '../../../__mocks__/liqodashtest.json';
import PieMockResponse from '../../../__mocks__/piecharts.json';
import HistoMockResponse from '../../../__mocks__/histocharts.json';
import LiqoDashNewMockResponse from '../../../__mocks__/liqodashtest_new.json';
import LiqoDashUpdatedMockResponse from '../../../__mocks__/liqodashtest_update.json';
import Error409 from '../../../__mocks__/409.json';
import Error401 from '../../../__mocks__/401.json';
import Error404 from '../../../__mocks__/404.json';

export function setup_login() {
  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}

export function mockCRDAndViews() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    }
  })
}

export function mockCRDAndViewsExtended(error, method) {
  fetch.mockResponse(req => {
    if (req.url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    }  else if (req.url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      if (req.method === 'GET') {
        return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
      } else if (req.method === 'POST') {
        if (error && method === 'POST') {
          if (error === '409') {
            return Promise.reject(Error409.body);
          } else {
            return Promise.reject(Error401.body);
          }
        } else {
          return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashNewMockResponse })))
        }
      } else if (req.method === 'PUT') {
        if (error && method === 'PUT') {
          if (error === '409') {
            return Promise.reject(Error409.body);
          } else {
            return Promise.reject(Error401.body);
          }
        } else {
          return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashUpdatedMockResponse })))
        }
      } else if (req.method === 'DELETE') {
        if (error && method === 'DELETE') {
          return Promise.reject(Error404.body);
        } else {
          return Promise.resolve();
        }
      }
    } else if (req.url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    } else if (req.url === 'http://localhost:3001/clustercustomobject/histocharts') {
      return Promise.resolve(new Response(JSON.stringify({body: HistoMockResponse })))
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
  expect(await screen.findByText(/welcome/i)).toBeInTheDocument();

}

export async function setup_resource(error, method) {
  mockCRDAndViewsExtended(error, method);
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  userEvent.click(await screen.findByText('Kind: LiqoDashTest'));

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
    } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: AdvMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/tunnelendpoints') {
      return Promise.resolve(new Response(JSON.stringify({ body: TunnMockResponse })))
    }
  })

  await loginTest();

  const customview = await screen.findByText('Liqo View');
  userEvent.click(customview);
}
