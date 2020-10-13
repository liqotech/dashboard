import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import { testTimeout } from '../src/constants';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';

fetchMock.enableMocks();

describe('Footer', () => {
  test('Footer is present', async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('Liqo @2020'));
  }, testTimeout)
})
