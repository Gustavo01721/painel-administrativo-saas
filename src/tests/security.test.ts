import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';

describe('Security Layer', () => {
  it('should generate valid HMAC-256 signatures', () => {
    const secret = 'test-secret';
    const timestamp = '1700000000';
    const body = JSON.stringify({ test: true });
    
    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${body}`)
      .digest('hex');
      
    expect(signature).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(signature)).toBe(true);
  });
});
