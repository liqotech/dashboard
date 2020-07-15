import { screen } from '@testing-library/react'
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import fetchMock from 'jest-fetch-mock';
import ErrorMockResponse from '../__mocks__/401.json';
import { loginTest, mockCRDAndViews, setup_login } from '../src/services/__mocks__/RTLUtils';

fetchMock.enableMocks();

describe('Login', () => {
  test('Login works and redirection is ok when successful', async () => {
    mockCRDAndViews();

    await loginTest();

    /** Assert that a success notification has spawned */
    expect(await screen.findByText(/successfully/i)).toBeInTheDocument();
  })

  test('Login works when the token is invalid', async  () => {
    fetch.mockImplementation((url) => {
      if (url === 'http://localhost:3001/customresourcedefinition') {
        return Promise.reject(new Response(JSON.stringify(ErrorMockResponse)))
      }
    })

    setup_login();

    /** Input mock password */
    const tokenInput = screen.getByLabelText('lab');
    userEvent.type(tokenInput, 'password');

    /** Click on login button */
    const submitButton = screen.getByRole('button');
    userEvent.click(submitButton);

    /** Assert that the token has been rejected */
    expect(await screen.findByText(/valid/i)).toBeInTheDocument();
  })
})
