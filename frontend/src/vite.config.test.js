import { describe, expect, it } from 'vitest';
import config from '../vite.config.js';

describe('Vite API proxy', () => {
  it('forwards /api requests to FastAPI without rewriting the path', () => {
    const apiProxy = config.server.proxy['/api'];

    expect(apiProxy.target).toBe('http://localhost:8000');
    expect(apiProxy.changeOrigin).toBe(true);
    expect(apiProxy.rewrite).toBeUndefined();
  });
});
