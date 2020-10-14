import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { generalMocks } from './RTLUtils';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import { testTimeout } from '../src/constants';
import Cookies from 'js-cookie';
import userEvent from '@testing-library/user-event';
import PodMockResponse from '../__mocks__/pod.json';

fetchMock.enableMocks();

async function setup() {
  Cookies.set('token', 'password');
  window.history.pushState({}, 'Page Title', '/api/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9');

  return render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  )
}

beforeEach(() => {
  Cookies.remove('token');
});

function mocks(error){
  fetch.mockResponse(req => {
    if((req.method === 'DELETE' || req.method === 'PATCH') && req.url === 'http://localhost/apiserver/api/v1/namespaces/test/pods/hello-world-deployment-6756549f5-x66v9'){
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

  test('Update resource', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('pods')).toBeInTheDocument();
    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();

    userEvent.click(await screen.findByText('JSON'));

    let res = PodMockResponse;
    res.metadata.namespace = 'testV2';
    res.metadata.resourceVersion += 1;

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(res));

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    userEvent.click(await screen.findByText('General'));

    let gen = await screen.findAllByText('General');
    userEvent.click(gen[1]);

    const textboxes = await screen.findAllByRole('textbox');

    expect(textboxes[3]).toHaveAttribute('value', 'testV2');

  }, testTimeout)

  test('Error on update resource', async () => {
    mocks(true);

    await setup();

    expect(await screen.findByText('pods')).toBeInTheDocument();
    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();

    userEvent.click(await screen.findByText('JSON'));

    let res = PodMockResponse;
    res.metadata.name += '2'

    await userEvent.type(screen.getByLabelText('editor'), JSON.stringify(res));

    userEvent.click(screen.getByRole('button', {name: 'Save'}));

    expect(await screen.findByText(/could not/i)).toBeInTheDocument();
  }, testTimeout)
})
