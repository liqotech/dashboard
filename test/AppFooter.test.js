import { render, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { testTimeout } from '../src/constants';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/app/App';
import { mockCRDAndViewsExtended, setToken } from './RTLUtils';

fetchMock.enableMocks();

describe('Footer', () => {
  test(
    'Footer is present',
    async () => {
      mockCRDAndViewsExtended();
      setToken();

      localStorage.setItem('theme', 'dark');

      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Proudly/i));
    },
    testTimeout
  );
});
