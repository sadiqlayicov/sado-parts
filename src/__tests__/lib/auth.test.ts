import { hashPassword, comparePassword, generateToken, verifyToken } from '../../lib/auth';
import type { JWTPayload } from '../../lib/auth';

describe('hashPassword / comparePassword', () => {
  it('hashes a password and verifies it matches', async () => {
    const plain = 'MyS3cretP@ss';
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    expect(hashed.length).toBeGreaterThan(0);

    const matches = await comparePassword(plain, hashed);
    expect(matches).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hashed = await hashPassword('correct');
    const matches = await comparePassword('wrong', hashed);
    expect(matches).toBe(false);
  });

  it('produces different hashes for the same password (salted)', async () => {
    const a = await hashPassword('same');
    const b = await hashPassword('same');
    expect(a).not.toBe(b);
  });
});

describe('generateToken / verifyToken', () => {
  const payload: JWTPayload = {
    userId: 'user-1',
    email: 'test@example.com',
    role: 'admin',
  };

  it('generates a JWT string', () => {
    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('verifyToken returns the original payload fields', () => {
    const token = generateToken(payload);
    const decoded = verifyToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.userId).toBe(payload.userId);
    expect(decoded!.email).toBe(payload.email);
    expect(decoded!.role).toBe(payload.role);
  });

  it('verifyToken returns null for an invalid token', () => {
    expect(verifyToken('invalid.token.here')).toBeNull();
  });

  it('verifyToken returns null for an empty string', () => {
    expect(verifyToken('')).toBeNull();
  });

  it('generates different tokens for different payloads', () => {
    const t1 = generateToken({ ...payload, userId: '1' });
    const t2 = generateToken({ ...payload, userId: '2' });
    expect(t1).not.toBe(t2);
  });
});
