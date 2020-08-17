import CRDmockResponse from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import ViewMockResponseLayout from '../__mocks__/views_withLayout.json';
import ViewMockModified from '../__mocks__/views_modified.json';
import ViewMockAltTemplate from '../__mocks__/views_alt_template.json';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockCRDAndViewsExtended, setup_cv } from './RTLUtils';
import fetchMock from 'jest-fetch-mock';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import CustomView from '../src/views/CustomView';
import AdvMockResponse from '../__mocks__/advertisement.json';
import FCMockResponse from '../__mocks__/foreigncluster.json';
import TunnMockResponse from '../__mocks__/tunnelendpoints.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import HistoMockResponse from '../__mocks__/histocharts.json';

fetchMock.enableMocks();

let api;

function mocks(view){
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({ body: view })))
    } else if (url === 'http://localhost:3001/clustercustomobject/advertisements') {
      return Promise.resolve(new Response(JSON.stringify({ body: AdvMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/foreignclusters') {
      return Promise.resolve(new Response(JSON.stringify({ body: FCMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/tunnelendpoints') {
      return Promise.resolve(new Response(JSON.stringify({ body: TunnMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if( url === 'http://localhost:3001/clustercustomobject/piecharts' ) {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/histocharts') {
      return Promise.resolve(new Response(JSON.stringify({body: HistoMockResponse })))
    }
  })
}

async function setup(error) {
  api = new ApiManager();
  api.getCRDs().then(() => {
    api.loadCustomViewsCRs().then(() => {

      if(error) api.customViews = [];

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
  test('Change CRD on custom view', async () => {
    mockCRDAndViewsExtended(null, 'PUT', 'advertisements', true);
    await setup();

    api.customViews = JSON.parse(JSON.stringify(ViewMockResponse.items));
    api.manageCallbackCVs(api.customViews);

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();

    await api.updateCustomResourceDefinition(null, api.getCRDfromKind('Advertisement'));

    expect(await screen.findByText(/modified/i));
  })

  test('Custom view react if new CRD has been added', async () => {
    mocks(ViewMockResponse);
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

  test('Custom view is empty if no Custom view', async () => {
    mocks(ViewMockResponseLayout);
    await setup(true);

    await new Promise((r) => setTimeout(r, 1000));

    await api.getCRDs();

    /** Modify the custom view */
    api.customViews = JSON.parse(JSON.stringify(ViewMockResponseLayout.items));
    api.manageCallbackCVs(api.customViews);

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();
  })

  test('Custom view with layout', async () => {
    mocks(ViewMockResponseLayout);
    await setup();

    /** Modify the custom view */
    api.customViews = JSON.parse(JSON.stringify(ViewMockResponseLayout.items));
    api.manageCallbackCVs(api.customViews);

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();
  })

  test('Change CR on custom view', async () => {
    mockCRDAndViewsExtended(null, 'PUT', 'advertisements', true);
    await setup();

    api.customViews = JSON.parse(JSON.stringify(ViewMockResponse.items));
    api.manageCallbackCVs(api.customViews);

    expect(await screen.findByText('Advertisement')).toBeInTheDocument();

    await api.updateCustomResource(null, null, null, 'advertisements', null, AdvMockResponse);

    expect(await screen.findByText(/resource/i));
  })

  test('Custom view shows alternative template', async () => {
    mocks(ViewMockAltTemplate);
    await setup();

    expect(await screen.findByText('Test')).toBeInTheDocument();
  })
})
