import { describe, expect, it } from 'vitest';
import { isDevelopmentHost } from './isDevelopmentHost';

describe('isDevelopmentHost', () => {
  it.each(['localhost', '127.0.0.1', '[::1]', '::1', '10.0.0.1', '10.255.255.255', '192.168.0.1', '192.168.255.255'])('allows %s', (hostname) => {
    expect(isDevelopmentHost(hostname)).toBe(true);
  });

  it.each(['example.com', '10.example.com', '192.168.example.com', '192.169.1.1', '11.0.0.1', '172.16.0.1', '10.0.0.256', '10.1.2', '192.168.0.1.example.com'])('rejects %s', (hostname) => {
    expect(isDevelopmentHost(hostname)).toBe(false);
  });
});
