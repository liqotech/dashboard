import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testTimeout } from '../src/constants';
import { generalMocks, loginTest, mockCRDAndViewsExtended, setToken } from './RTLUtils';
import Cookies from 'js-cookie';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import React from 'react';
import fetchMock from 'jest-fetch-mock';
import Error401 from '../__mocks__/401.json';

fetchMock.enableMocks();

jest.mock('../src/services/api/ApiManager');

async function setup() {
  mockCRDAndViewsExtended();
  await loginTest();

  const customview = screen.getByText('Custom Resources');
  userEvent.click(customview);

  expect(await screen.findByText(/advertisement./i)).toBeInTheDocument();

  expect(screen.getAllByRole('row')).toHaveLength(10);
}

function mocks(errorPATCH, errorPUT){
  fetch.mockResponse(req => {
    if(req.method === 'PATCH' && errorPATCH){
      return Promise.reject();
    } else if(req.method === 'PUT' && errorPUT){
      return Promise.reject(Error401.body);
    }
    else if(generalMocks(req.url))
      return generalMocks(req.url);
  })
}

beforeEach(() => {
  Cookies.remove('token');
});

describe('Favourites and Icons', () => {
  test('Sidebar updates when a resource is added/removed to favourites', async () => {
    await setup();

    let cdown = await screen.findAllByLabelText('caret-down');
    userEvent.click(cdown[0]);
    userEvent.click(cdown[1]);

    let stars = await screen.findAllByLabelText('star');

    userEvent.click(stars[2]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('Custom Resources')).not.toBeInTheDocument();

    userEvent.click(stars[2]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('Custom Resources')).toBeInTheDocument();

    userEvent.click(stars[4]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    userEvent.click(stars[4]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

  }, testTimeout)

  test('Sidebar and List update icons', async () => {
    await setup();

    expect(await screen.findAllByLabelText('caret-down'));

    let icons = await screen.findAllByLabelText('file-text');

    userEvent.click(icons[1]);

    expect(await screen.findByText('Icons'));

    const textbox = await screen.findByRole('input');

    await userEvent.type(textbox, 'fileadd');

    expect(await screen.findByLabelText('file-add')).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText('file-add'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.findAllByLabelText('file-add')).toHaveLength(2);

  }, testTimeout)

  test('Close icons modal', async () => {
    await setup();

    expect(await screen.findAllByLabelText('caret-down'));

    let icons = await screen.findAllByLabelText('file-text');

    userEvent.click(icons[1]);

    expect(await screen.findByLabelText('close')).toBeInTheDocument();
    userEvent.click(await screen.findByLabelText('close'));
    expect(await screen.queryByText('Icons')).not.toBeInTheDocument();

  }, testTimeout)

  test('Error on favourites (resource)', async () => {
    mocks(true);

    await loginTest();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    expect(await screen.findAllByLabelText('caret-down'));

    let stars = await screen.findAllByLabelText('star');

    userEvent.click(stars[2]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('Custom Resources')).not.toBeInTheDocument();

    userEvent.click(stars[2]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByText('Custom Resources')).toBeInTheDocument();

    userEvent.click(stars[4]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

  }, testTimeout)

  test('Error on favourites (config)', async () => {
    mocks(true, true);

    await loginTest();

    const customview = screen.getByText('Custom Resources');
    userEvent.click(customview);

    expect(await screen.findAllByLabelText('caret-down'));

    let stars = await screen.findAllByLabelText('star');

    userEvent.click(stars[2]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.findByText('Custom Resources')).toBeInTheDocument();

  }, testTimeout)

  test('Manage favourites when resource not in the config', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    expect(await screen.findByText('Pod')).toBeInTheDocument();

    let stars = await screen.findAllByLabelText('star');

    userEvent.click(stars[2]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.findAllByText('Pod')).toHaveLength(2);

  }, testTimeout)

  test('Manage icons when resource not in the config', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/api/v1/pods');

    render(
      <MemoryRouter>
        <App/>
      </MemoryRouter>
    )

    expect(await screen.findByText('Pod')).toBeInTheDocument();

    let icons = await screen.findAllByLabelText('api');

    userEvent.click(icons[2]);

    expect(await screen.findByText('Icons'));

    const textbox = await screen.findByRole('input');

    await userEvent.type(textbox, 'fileadd');

    expect(await screen.findByLabelText('file-add')).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText('file-add'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.findByLabelText('file-add')).toBeInTheDocument();

  }, testTimeout)
})
