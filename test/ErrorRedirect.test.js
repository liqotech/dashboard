import { screen } from '@testing-library/react'
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import fetchMock from 'jest-fetch-mock';
import CRDMockResponse from '../__mocks__/crd_fetch.json';
import Error401 from '../__mocks__/401.json';
import Error403 from '../__mocks__/403.json';
import Error500 from '../__mocks__/500.json';
import { alwaysPresentGET, generalHomeGET, loginTest } from './RTLUtils';
import ViewMockResponse from '../__mocks__/views.json';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';

fetchMock.enableMocks();

async function setup(error) {
  fetch.mockImplementation(async (url) => {
    if (url === 'http://localhost:3001/customresourcedefinition') {
      return Promise.resolve(new Response(JSON.stringify(CRDMockResponse)))
    } else if (url === 'http://localhost:3001/clustercustomobject/views') {
      return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
    } else if (url === 'http://localhost:/apiserver/apis/apiextensions.k8s.io/v1/customresourcedefinitions/liqodashtests.dashboard.liqo.io') {
      if(error === 401){
        return Promise.reject(Error401.body);
      } else if(error === 403){
        return Promise.reject(Error403.body);
      } else if(error === 500){
        return Promise.reject();
      }
    } else if(alwaysPresentGET(url)){
      return alwaysPresentGET(url)
    } else {
      return generalHomeGET(url);
    }
  })

  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  userEvent.click(await screen.findByText('liqodashtests.dashboard.liqo.io'));
}

beforeEach(() => {
  Cookies.remove('token');
});

describe('ErrorRedirect', () => {
  test('401 redirect works', async  () => {
    await setup(401);
    expect(await screen.findByText(/401/i)).toBeInTheDocument();
  }, testTimeout)

  test('403 redirect works', async  () => {
    await setup(403);
    expect(await screen.findByText(/403/i)).toBeInTheDocument();
  }, testTimeout)

  test('Default redirect works', async  () => {
    await setup(500);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();

    userEvent.click(screen.getByText(/logout/i));

    expect(await screen.findByLabelText('lab')).toBeInTheDocument();
  }, testTimeout)
})
