import { ErrorMessages, getErrorMessage, logError } from '../../lib/api-utils';

describe('ErrorMessages', () => {
  it('has static string messages', () => {
    expect(ErrorMessages.UNAUTHORIZED).toBe('İstifadəçi təsdiqlənməyib');
    expect(ErrorMessages.INTERNAL_ERROR).toBe('Daxili server xətası');
    expect(ErrorMessages.CART_EMPTY).toBe('Səbət boşdur');
    expect(ErrorMessages.FILE_TOO_LARGE).toBe('Fayl həcmi çox böyükdür');
  });

  it('has template functions for dynamic messages', () => {
    expect(ErrorMessages.REQUIRED_FIELD('Email')).toBe('Email tələb olunur');
    expect(ErrorMessages.NOT_FOUND('Məhsul')).toBe('Məhsul tapılmadı');
    expect(ErrorMessages.ALREADY_EXISTS('İstifadəçi')).toBe('İstifadəçi artıq mövcuddur');
    expect(ErrorMessages.CREATION_FAILED('Sifariş')).toBe('Sifariş yaradılması uğursuz oldu');
    expect(ErrorMessages.UPDATE_FAILED('Kateqoriya')).toBe('Kateqoriya yenilənməsi uğursuz oldu');
    expect(ErrorMessages.DELETION_FAILED('Məhsul')).toBe('Məhsul silinməsi uğursuz oldu');
  });
});

describe('getErrorMessage', () => {
  it('returns the string directly when given a string', () => {
    expect(getErrorMessage('something failed')).toBe('something failed');
  });

  it('returns error.message when given an Error instance', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('returns message property from a plain object', () => {
    expect(getErrorMessage({ message: 'obj error' })).toBe('obj error');
  });

  it('converts non-string message to string', () => {
    expect(getErrorMessage({ message: 42 })).toBe('42');
  });

  it('returns INTERNAL_ERROR for null', () => {
    expect(getErrorMessage(null)).toBe(ErrorMessages.INTERNAL_ERROR);
  });

  it('returns INTERNAL_ERROR for undefined', () => {
    expect(getErrorMessage(undefined)).toBe(ErrorMessages.INTERNAL_ERROR);
  });

  it('returns INTERNAL_ERROR for a number', () => {
    expect(getErrorMessage(123)).toBe(ErrorMessages.INTERNAL_ERROR);
  });

  it('returns INTERNAL_ERROR for an object without message', () => {
    expect(getErrorMessage({ code: 500 })).toBe(ErrorMessages.INTERNAL_ERROR);
  });
});

describe('logError', () => {
  let consoleSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs error with context prefix', () => {
    logError('TestContext', new Error('test error'));
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const [prefix, detail] = consoleSpy.mock.calls[0];
    expect(prefix).toBe('[TestContext] Error:');
    expect(detail.message).toBe('test error');
    expect(detail.stack).toBeDefined();
    expect(detail.timestamp).toBeDefined();
  });

  it('logs string error without stack', () => {
    logError('Ctx', 'simple error');
    const detail = consoleSpy.mock.calls[0][1];
    expect(detail.message).toBe('simple error');
    expect(detail.stack).toBeUndefined();
  });

  it('includes additional data when provided', () => {
    logError('Ctx', 'err', { userId: '123' });
    const detail = consoleSpy.mock.calls[0][1];
    expect(detail.additionalData).toEqual({ userId: '123' });
  });
});
