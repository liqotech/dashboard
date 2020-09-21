import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import CRDmockEmpty from '../__mocks__/crd_fetch.json';
import ViewMockResponse from '../__mocks__/views.json';
import LiqoDashMockResponse from '../__mocks__/liqodashtest.json';
import PieMockResponse from '../__mocks__/piecharts.json';
import ApiManager from '../src/services/__mocks__/ApiManager';
import { MemoryRouter } from 'react-router-dom';
import CRD from '../src/CRD/CRD';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

async function setup() {
  fetch.mockImplementation((url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:3001/clustercustomobject/liqodashtests') {
      return Promise.resolve(new Response(JSON.stringify({ body: LiqoDashMockResponse })))
    } else if (url === 'http://localhost:3001/clustercustomobject/piecharts') {
      return Promise.resolve(new Response(JSON.stringify({ body: PieMockResponse })))
    }
  })

  window.api = new ApiManager({id_token: 'test'});
  window.api.getCRDs().then(async () => {
    render(
      <MemoryRouter>
        <CRD match={{
               params: {
                 crdName: 'liqodashtests.dashboard.liqo.com'
               }
             }}/>
      </MemoryRouter>
    )
  });
}

describe('Header', () => {
  test('Header main menus item and search bar are showed', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    expect(await screen.findByLabelText('notification')).toBeInTheDocument();
    expect(await screen.findAllByLabelText('question-circle')).toHaveLength(3);
    expect(await screen.findByLabelText('logout')).toBeInTheDocument();
    const CRDInput = await screen.findAllByRole('combobox');
    expect(CRDInput[0]).toHaveAttribute('placeholder', 'input CRD');
  }, testTimeout)

  test('Logout works', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    const logout = await screen.findByLabelText('logout');
    userEvent.click(logout);
    expect(screen.getByText('Liqo Login'));
  }, testTimeout)

  test('Search works', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    await screen.findByLabelText('autocompletesearch');
    userEvent.type(screen.getAllByRole('combobox')[0], 'LiqoDashTest@liqodashtests.dashboard.liqo.com');
    userEvent.click(await screen.findByLabelText('search'));
    expect(await screen.findByLabelText('crd')).toBeInTheDocument();
    expect(await screen.findByText('LiqoDashTest')).toBeInTheDocument();
  }, testTimeout)
})
