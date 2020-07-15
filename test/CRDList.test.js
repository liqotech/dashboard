import { screen } from '@testing-library/react'
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViews } from '../src/services/__mocks__/RTLUtils';
import userEvent from '@testing-library/user-event';
import CRDmockResponse from '../__mocks__/crd_fetch_long.json';
import CRDmockEmpty from '../__mocks__/crd_empty.json';
import ViewMockResponse from '../__mocks__/views.json';

fetchMock.enableMocks();

jest.mock('../src/services/ApiManager');

async function setup() {
  mockCRDAndViews();
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  expect(screen.getAllByLabelText('crd')).toHaveLength(8);
}

describe('CRD List', () => {
  test('CRD list is correctly paginated and updated when page is changed', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockResponse)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      }
    })

    await loginTest();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    expect(screen.getAllByLabelText('crd')).toHaveLength(10);

    userEvent.click(screen.getByText('2'));

    expect(await screen.findAllByLabelText('crd')).toHaveLength(2);

  })

  test('CRD list cards show all the data and the right description', async () => {
    await setup();

    expect(screen.getByText('advertisements.protocol.liqo.io'));
    expect(screen.getByText('Kind: Advertisement'));
    expect(screen.getAllByText('Description')).toHaveLength(8);
    expect(screen.getAllByText('This CRD has no description')).toHaveLength(5);

    expect(screen.getByText('This CRD is used to create custom views from a set of CRDs'));
  })

  test('Sidebar updates when a CRD is added/removed to favourites', async () => {
    await setup();

    const favCRD = screen.getAllByLabelText('star')[2];
    userEvent.click(favCRD);

    expect(await screen.findByText('Advertisement'));

    userEvent.click(favCRD);

    expect(screen.queryByText('Advertisement')).not.toBeInTheDocument();
  })

  test('Empty notification when no CRDs', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.resolve(new Response(JSON.stringify(CRDmockEmpty)))
      } else if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.resolve(new Response(JSON.stringify({body: ViewMockResponse})))
      }
    })

    await loginTest();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    expect(screen.queryByLabelText('crd')).not.toBeInTheDocument();

    expect(screen.getByText(/found/i)).toBeInTheDocument();
  })
})
