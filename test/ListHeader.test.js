import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { generalMocks } from './RTLUtils';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import userEvent from '@testing-library/user-event';
import PodMockResponse from '../__mocks__/pod.json';

fetchMock.enableMocks();

async function setup() {
  Cookies.set('token', 'password');
  window.history.pushState({}, 'Page Title', '/api/v1/pods');

  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
}

beforeEach(() => {
  Cookies.remove('token');
});

function mocks(){
  fetch.mockImplementation((url) => {
    if(generalMocks(url))
      return generalMocks(url);
  })
}

describe('ListHeader', () => {
  test('Header list add pod', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('Pod')).toBeInTheDocument();

    userEvent.click(screen.getByLabelText('plus'));

    expect(await screen.findByText(/create a new pod resource/i)).toBeInTheDocument();

    let res = PodMockResponse;
    res.metadata.name += '2'

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(res));

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    expect(await screen.findAllByRole('row')).toHaveLength(4);
  }, testTimeout)

  test('Change namespace change resources', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('Pod')).toBeInTheDocument();
    expect(await screen.findAllByRole('row')).toHaveLength(4);

    const ns = screen.getByText('all namespaces');
    userEvent.click(ns);

    const ns_liqo = await screen.findByText('liqo');
    const ns_default = await screen.findAllByText('default');

    expect(ns_liqo).toBeInTheDocument();
    expect(ns_default[1]).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseOver(ns_liqo);
      fireEvent.click(ns_liqo);

      await new Promise((r) => setTimeout(r, 1000));
    })

    expect(await screen.queryByRole('row')).not.toBeInTheDocument();
  }, testTimeout)
})
