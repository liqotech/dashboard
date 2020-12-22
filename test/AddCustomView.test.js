import { act, fireEvent, screen, render } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { alwaysPresentGET, mockCRDAndViewsExtended, setToken } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import { testTimeout } from '../src/constants';
import { MemoryRouter } from 'react-router-dom';
import ApiInterface from '../src/services/api/ApiInterface';
import DashboardConfig from '../__mocks__/dashboardconf.json';
import AddCustomView from '../src/customView/AddCustomView';

fetchMock.enableMocks();

beforeEach(() => {
  window.APISERVER_URL = window.location.protocol + '//' + window.location.hostname + '/apiserver';
  localStorage.setItem('theme', 'dark');
});

describe('Header', () => {

  test('Create a custom view', async () => {
    mockCRDAndViewsExtended();
    window.api = ApiInterface({id_token: 'test'});
    setToken();
    window.api.dashConfigs.current = DashboardConfig.items[0];

    render(
      <MemoryRouter>
        <AddCustomView />
      </MemoryRouter>
    )

    userEvent.click(await screen.findByText(/new custom view/i))

    await userEvent.type(screen.getAllByRole('input')[0], 'deployments');

    await userEvent.type(screen.getAllByRole('combobox')[0], 'deployment');
    let test = await screen.findByText('deployments');
    fireEvent.mouseOver(test);
    userEvent.click(test);

    await userEvent.type(screen.getAllByRole('combobox')[0], 'deployment');
    test = await screen.findAllByText('deployments');
    fireEvent.mouseOver(test[1]);
    fireEvent.keyPress(test[1], { key: "Enter", code: 13, charCode: 13 });

    await userEvent.type(screen.getAllByRole('combobox')[0], 'deployment');
    test = await screen.findByText('deployments');
    fireEvent.mouseOver(test);
    fireEvent.keyPress(test, { key: "Enter", code: 13, charCode: 13 });

    await act(async () => {
      userEvent.click(screen.getByText('OK'));
      await new Promise((r) => setTimeout(r, 500));
    })

  }, testTimeout)

  test('Create a custom view with error', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/clustercustomobject/views') {
        return Promise.reject(403)
      } else if(alwaysPresentGET(url)){
        return alwaysPresentGET(url)
      }
    });
    window.api = ApiInterface({id_token: 'test'});
    setToken();
    window.api.dashConfigs.current = DashboardConfig.items[0];

    render(
      <MemoryRouter>
        <AddCustomView />
      </MemoryRouter>
    )

    userEvent.click(await screen.findByText(/new custom view/i))

    await userEvent.type(screen.getAllByRole('input')[0], 'deployments');

    await userEvent.type(screen.getAllByRole('combobox')[0], 'deployment');
    let test = await screen.findByText('deployments');
    fireEvent.mouseOver(test);
    fireEvent.keyPress(test, { key: "Enter", code: 13, charCode: 13 });

    await act(async () => {
      userEvent.click(await screen.findByText('OK'));
      await new Promise((r) => setTimeout(r, 500));
    })

  }, testTimeout)
})
