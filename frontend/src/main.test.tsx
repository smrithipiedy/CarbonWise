import { describe, it, vi } from 'vitest';


vi.mock('react-dom/client', () => ({
  createRoot: vi.fn().mockReturnValue({ render: vi.fn() })
}));

describe('main', () => {
  it('renders', async () => {
    document.body.innerHTML = '<div id="root"></div>';
    await import('./main');
  });
});
