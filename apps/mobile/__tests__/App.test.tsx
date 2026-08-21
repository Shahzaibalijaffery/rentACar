import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { App } from '../src/App';

describe('App', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<App />);
    });
  });
});
