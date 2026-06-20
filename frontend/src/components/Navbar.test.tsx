import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

describe('Navbar', () => {
  it('renders and clicks calculator', () => {
    render(<BrowserRouter><Navbar /></BrowserRouter>);
    const btn = screen.getByText(/Calculator/i);
    fireEvent.click(btn);
  });

  it('renders and clicks calculator from other route', () => {
    window.history.pushState({}, '', '/results');
    render(<BrowserRouter><Navbar /></BrowserRouter>);
    const btn = screen.getByText(/Calculator/i);
    fireEvent.click(btn);
  });
});
