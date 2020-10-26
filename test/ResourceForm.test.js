import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { generalMocks } from './RTLUtils';
import { fireEvent, render, screen } from '@testing-library/react';
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

function mocks(){
  fetch.mockResponse(req => {
    if(generalMocks(req.url))
      return generalMocks(req.url);
  })
}

describe('ResourceForm', () => {
  test('Search property works', async () => {
    mocks();

    await setup();

    expect(await screen.findByText('pods')).toBeInTheDocument();
    expect(await screen.findByText('hello-world-deployment-6756549f5-x66v9')).toBeInTheDocument();

    let select = await screen.findAllByLabelText('select-k8s');
    userEvent.click(select[1]);

    await userEvent.type(select[1], 'labels');

    let labels = await screen.findAllByText('labels');

    fireEvent.mouseOver(labels[0]);
    fireEvent.click(labels[0]);

    expect(await screen.findByText('Metadata > Labels')).toBeInTheDocument();
    userEvent.click(await screen.findByText('Metadata > Labels'));

    const edit = await screen.findAllByLabelText('edit');
    userEvent.click(edit[0]);

    let textboxes = await screen.findAllByRole('textbox');

    await userEvent.type(textboxes[1], '2');

    userEvent.click(await screen.findByText('Save changes'));

  }, testTimeout)
})
