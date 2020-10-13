import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import fetchMock from 'jest-fetch-mock';
import { loginTest, mockCRDAndViewsExtended } from './RTLUtils';
import userEvent from '@testing-library/user-event';
import { testTimeout } from '../src/constants';

fetchMock.enableMocks();

describe('Header', () => {

  test('Header main menus item and search bar are showed and working, ' +
    'logout works', async () => {
    mockCRDAndViewsExtended();
    await loginTest();

    expect(await screen.findAllByLabelText('question-circle')).toHaveLength(3);
    expect(await screen.findByLabelText('logout')).toBeInTheDocument();
    const CRDInput = await screen.findAllByRole('combobox');
    expect(CRDInput[0]).toHaveAttribute('placeholder', 'Search resource');

    await screen.findByLabelText('autocompletesearch');
    await userEvent.type(screen.getAllByRole('combobox')[0], 'liqodashtest');
    let test = await screen.findByText('liqodashtests');
    fireEvent.mouseOver(test);
    fireEvent.click(test);
    expect(await screen.findByText('apis')).toBeInTheDocument();
    expect(await screen.findByText('LiqoDashTest')).toBeInTheDocument();
    expect(await screen.findByText('test-1')).toBeInTheDocument();

    const logout = await screen.findByLabelText('logout');
    userEvent.click(logout);
    expect(screen.getByText('Liqo Login'));

  }, testTimeout)
})
