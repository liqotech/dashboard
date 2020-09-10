import { screen } from '@testing-library/react'
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

describe('Login', () => {
  test('Login works and redirection is ok when successful', async () => {
    mockCRDAndViewsExtended();

    await loginTest();

    /** Assert that a success notification has spawned */
    expect(await screen.findByText(/successfully/i)).toBeInTheDocument();
  }, testTimeout)
})
