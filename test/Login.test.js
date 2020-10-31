import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { setup_login } from './RTLUtils';
import { testTimeout } from '../src/constants';
import Error401 from '../__mocks__/401.json';
import userEvent from '@testing-library/user-event';
import NodesMockResponse from '../__mocks__/nodes.json';
import Cookies from 'js-cookie';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';

fetchMock.enableMocks();

beforeEach(() => {
  Cookies.remove('token');
});

describe('Login', () => {
  test('Login when no CRDs return error', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.reject(Error401.body)
      } else if (url === 'http://localhost:3001/nodes') {
        return Promise.resolve(new Response(JSON.stringify({body: NodesMockResponse})));
      }
    })

    setup_login();

    /** Input mock password */
    const tokenInput = screen.getByLabelText('lab');
    await userEvent.type(tokenInput, 'password');

    /** Click on login button */
    const submitButton = screen.getByRole('button');
    userEvent.click(submitButton);

    expect(await screen.findByText('401')).toBeInTheDocument();
  }, testTimeout)

  test('Login wrong token error', async () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/nodes') {
        return Promise.reject(Error401.body)
      }
    })

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    /** Input mock password */
    const tokenInput = screen.getByLabelText('lab');
    await userEvent.type(tokenInput, 'password');

    /** Click on login button */
    const submitButton = screen.getByRole('button');
    userEvent.click(submitButton);

    expect(await screen.findByText(/not valid/i)).toBeInTheDocument();
  }, testTimeout)
})
