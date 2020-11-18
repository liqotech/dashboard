import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { generalMocks, setToken } from './RTLUtils';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import userEvent from '@testing-library/user-event';
import PodMockResponse from '../__mocks__/pod.json';
import ViewMockResponse from '../__mocks__/views.json';

fetchMock.enableMocks();

async function setup() {
  setToken();
  window.history.pushState({}, 'Page Title', '/api/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9');

  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
}

beforeEach(() => { localStorage.setItem('theme', 'dark');
  Cookies.remove('token');
});

function mocks(error){
  fetch.mockResponse(req => {
    if(req.method === 'DELETE' && req.url === 'http://localhost/apiserver/api/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9'){
      if(!error)
        return Promise.resolve(new Response(JSON.stringify('')));
      else
        return Promise.reject();
    }
    else if(generalMocks(req.url))
      return generalMocks(req.url);
  })
}

describe('ResourceHeader', () => {
  test('Header delete resource', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('pods')).toBeInTheDocument();
    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();
    expect(await screen.findByText('DELETE')).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText('delete'));
    userEvent.click(await screen.findByText('Yes'));

    expect(await screen.findByText('Pod terminating...')).toBeInTheDocument();

    await new Promise((r) => setTimeout(r, 1000));

    await act(async () => {
      window.api.apiManager.current.sendDeletedSignal('pods', PodMockResponse);
    })

    expect(await screen.findByText('Resource could not be found')).toBeInTheDocument();

  }, testTimeout)

  test('Error on delete resource', async () => {
    mocks(true);

    await setup();

    expect(await screen.findByText('pods')).toBeInTheDocument();
    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();
    expect(await screen.findByText('DELETE')).toBeInTheDocument();

    userEvent.click(await screen.findByLabelText('delete'));
    userEvent.click(await screen.findByText('Yes'));

    expect(await screen.findByText(/could not/i)).toBeInTheDocument();

  }, testTimeout)

  test('Header click on group', async () => {
    mocks();

    setToken();
    window.history.pushState({}, 'Page Title', '/apis/apiextensions.k8s.io/v1/customresourcedefinitions');

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    )

    expect(await screen.findByText('apiextensions.k8s.io')).toBeInTheDocument();

    await act(async () => {
      userEvent.click(await screen.findByText('apiextensions.k8s.io'));
    })

    expect(await screen.findByText('customresourcedefinitions')).toBeInTheDocument();

  }, testTimeout)
})
