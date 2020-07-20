import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import ViewMockModified from '../__mocks__/views_modified.json';
import CRDEmpty from '../__mocks__/crd_empty.json';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { loginTest, setup_cv, setup_login } from './RTLUtils';
import fetchMock from 'jest-fetch-mock';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import CustomView from '../src/views/CustomView';
import AdvMockResponse from '../__mocks__/advertisement.json';
import TunnMockResponse from '../__mocks__/tunnelendpoints.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';

fetchMock.enableMocks();

let api;

async function setup() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: ViewMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: AdvMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/tunnelendpoints') {
      return Promise.resolve(new Response(JSON.stringify({ body: TunnMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if( url === 'http://localhost:3001/clustercustomobject/piecharts' ) {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    }
  })

  api = new ApiManager();
  api.getCRDs().then(() => {
    api.loadCustomViewsCRs().then(() => {
      render(
        <MemoryRouter>
          <CustomView api={api}
                      match={{params: {viewName: 'awesome-view'}}}
          />
        </MemoryRouter>
      )
    });
  })
}

describe('CustomView', () => {
  test('Custom view react if new CRD has been added', async () => {
    await setup();

    expect(await screen.findByText('Test')).toBeInTheDocument();

    /** Modify the custom view */
    api.customViews = JSON.parse(JSON.stringify(ViewMockModified.items));
    api.manageCallbackCVs(api.customViews);

    expect(await screen.findByText('LiqoDashTest')).toBeInTheDocument();
  })

  test('Pinned card works', async () => {
    await setup_cv(ViewMockResponse);

    const pin = await screen.findAllByLabelText('pushpin');

    userEvent.click(pin[0]);
  })
})
