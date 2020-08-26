import { screen } from '@testing-library/react'
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended, setup_cv } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import CRDmockResponse from '../__mocks__/crd_fetch.json';

fetchMock.enableMocks();

describe('Sidebar', () => {
  test('Sidebar main menus item and submenus item are showed', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    expect(await screen.findAllByText(/Home/i)).toHaveLength(2);

    expect(await screen.findByText(/custom/i)).toBeInTheDocument();

    expect(await screen.findByText(/favourites/i)).toBeInTheDocument();

    expect(await screen.findByText(/settings/i)).toBeInTheDocument();

    expect(await screen.findByText('Liqo View')).toBeInTheDocument();

    expect(await screen.findByText('View')).toBeInTheDocument();
  })

  test('Sidebar custom view redirect is ok', async () => {
    await setup_cv();

    expect(await screen.findAllByLabelText('crd_custom_view')).toHaveLength(2);
  })

  test('Sidebar custom resource redirect is ok', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    const customview = await screen.findByText('Custom Resources');
    userEvent.click(customview);

    expect(await screen.findAllByRole('row')).toHaveLength(11);
  })

  test('Sidebar favourite redirect is ok', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    const customview = await screen.findByText('View');
    userEvent.click(customview);

    expect(await screen.findByLabelText('crd'));
  })

  test('Sidebar collapse works', async () => {
    await setup_cv();

    await screen.findAllByRole('img');

    userEvent.click(await screen.findByLabelText('left'));

    expect(await screen.queryByLabelText('left')).not.toBeInTheDocument();
  }, 30000)
})

