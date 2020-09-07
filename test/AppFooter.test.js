import { screen } from '@testing-library/react'
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

describe('Footer', () => {
  test('Footer is present', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    expect(await screen.findByText('Liqo @2020'));
  }, testTimeout)
})
