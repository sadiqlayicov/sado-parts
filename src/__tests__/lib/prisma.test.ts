jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

import { withTimeout } from '../../lib/prisma';

describe('withTimeout', () => {
  it('resolves when the promise finishes before the timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 1000);
    expect(result).toBe('ok');
  });

  it('rejects with timeout error when the promise exceeds the timeout', async () => {
    const slow = new Promise<string>((resolve) => {
      setTimeout(() => resolve('late'), 5000);
    });
    await expect(withTimeout(slow, 50)).rejects.toThrow(
      'Operation timed out after 50 ms'
    );
  });

  it('propagates the original rejection', async () => {
    const failing = Promise.reject(new Error('original error'));
    await expect(withTimeout(failing, 1000)).rejects.toThrow('original error');
  });

  it('works with non-string resolved values', async () => {
    const result = await withTimeout(Promise.resolve(42), 1000);
    expect(result).toBe(42);
  });
});
