import { act, fireEvent, screen, render } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended, setToken } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import { testTimeout } from '../src/constants';
import AppHeader from '../src/common/AppHeader';
import { MemoryRouter } from 'react-router-dom';
import ApiInterface from '../src/services/api/ApiInterface';
import DashboardConfig from '../__mocks__/dashboardconf.json';

fetchMock.enableMocks();

beforeEach(() => {
  localStorage.setItem('theme', 'dark');
});

describe('Header', () => {

  test('Header main menus item and search bar are showed and working, ' +
    'logout works', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    expect(await screen.findAllByLabelText('question-circle')).toHaveLength(3);
    expect(await screen.findByLabelText('logout')).toBeInTheDocument();

    await screen.findByLabelText('autocompletesearch');

    window.api.autoCompleteCallback.current[0]();

    await userEvent.type(screen.getAllByRole('combobox')[0], 'liqodashtest');
    let test = await screen.findByText('liqodashtests');
    fireEvent.mouseOver(test);
    fireEvent.click(test);
    expect(await screen.findByText('apis')).toBeInTheDocument();
    expect(await screen.findByText('LiqoDashTest')).toBeInTheDocument();
    expect(await screen.findByText('test-1')).toBeInTheDocument();

    const logout = await screen.findByLabelText('logout');
    userEvent.click(logout);
    expect(screen.getByText('Liqo Login'));

  }, testTimeout)

  test('Header info', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    let question = await screen.findAllByLabelText('question-circle');
    userEvent.click(question[0]);

    expect(await screen.findByText('LiqoDash Information')).toBeInTheDocument();

    await act(async () => {
      let close = await screen.findAllByLabelText('close');
      userEvent.click(close[0]);
      userEvent.click(close[1]);
      await new Promise((r) => setTimeout(r, 500));
    })

  }, testTimeout)

  test('Toggle dark/light', async () => {
    window.api = ApiInterface({id_token: 'test'});
    setToken();
    window.api.dashConfigs.current = DashboardConfig.items[0];
    window.less = {modifyVars: async () => {return Promise.resolve()}}

    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    )

    const switcher = await screen.findByRole('switch');

    await act(async () => {
      userEvent.click(switcher)
      await new Promise((r) => setTimeout(r, 500));
    })

    await act(async () => {
      userEvent.click(switcher)
      await new Promise((r) => setTimeout(r, 500));
    })

    userEvent.click(await screen.findByLabelText('crown'))

    userEvent.click(await screen.findByLabelText('folder'))

  }, testTimeout)
})
