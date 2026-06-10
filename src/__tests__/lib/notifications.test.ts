import {
  addNotification,
  getNotifications,
  clearNotifications,
} from '../../lib/notifications';

beforeEach(() => {
  clearNotifications();
});

describe('addNotification', () => {
  it('adds a notification with type and message', () => {
    addNotification('order', 'New order received');
    const all = getNotifications();
    expect(all).toHaveLength(1);
    expect(all[0].type).toBe('order');
    expect(all[0].message).toBe('New order received');
    expect(all[0].time).toBeDefined();
    expect(all[0].createdAt).toBeInstanceOf(Date);
  });

  it('includes optional data', () => {
    addNotification('payment', 'Payment received', { amount: 100 });
    const all = getNotifications();
    expect(all[0].data).toEqual({ amount: 100 });
  });

  it('keeps at most 100 notifications', () => {
    for (let i = 0; i < 110; i++) {
      addNotification('test', `msg-${i}`);
    }
    const all = getNotifications();
    expect(all).toHaveLength(100);
    // The first 10 should have been pruned; earliest remaining is msg-10
    expect(all[0].message).toBe('msg-10');
    expect(all[99].message).toBe('msg-109');
  });
});

describe('getNotifications', () => {
  it('returns an empty array when no notifications exist', () => {
    expect(getNotifications()).toEqual([]);
  });

  it('returns a copy (not the internal array)', () => {
    addNotification('a', 'msg');
    const first = getNotifications();
    const second = getNotifications();
    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});

describe('clearNotifications', () => {
  it('removes all notifications', () => {
    addNotification('a', 'one');
    addNotification('b', 'two');
    expect(getNotifications()).toHaveLength(2);

    clearNotifications();
    expect(getNotifications()).toHaveLength(0);
  });
});
