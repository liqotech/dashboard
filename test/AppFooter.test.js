import { screen } from '@testing-library/react'
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViews } from '../src/services/__mocks__/RTLUtils';

fetchMock.enableMocks();

describe('Footer', () => {
  test('Footer is present', async () => {
    mockCRDAndViews();
    await loginTest();

    expect(await screen.findByText('Liqo @2020'));
  })
})
