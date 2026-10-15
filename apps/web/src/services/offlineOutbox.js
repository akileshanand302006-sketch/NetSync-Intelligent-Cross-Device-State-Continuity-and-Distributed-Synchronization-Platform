/**
 * NetSync Offline Outbox Queue & Sync Manager
 * ===========================================
 * Implements Non-Negotiable Rule 5.1 & ADR 0004:
 * - Queues mutations locally when offline.
 * - Tracks online/offline connectivity events.
 * - Flushes pending mutations sequentially with idempotency keys upon reconnect.
 * - Detects conflicts and invokes the conflict inspector when revisions diverge.
 */

const OUTBOX_STORAGE_KEY = 'netsync_offline_outbox_v1';

class OfflineOutboxManager {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this.conflictListeners = new Set();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this._notifyListeners();
        this.flushOutbox();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this._notifyListeners();
      });
    }
  }

  getPendingQueue() {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  enqueueMutation(mutation) {
    const queue = this.getPendingQueue();
    const entry = {
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      idempotencyKey: crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`,
      status: 'queued',
      ...mutation,
    };
    queue.push(entry);
    this._saveQueue(queue);
    this._notifyListeners();

    if (this.isOnline) {
      this.flushOutbox();
    }
    return entry;
  }

  async flushOutbox() {
    const queue = this.getPendingQueue();
    if (queue.length === 0 || !this.isOnline) return;

    const remaining = [];
    for (const mutation of queue) {
      try {
        const res = await fetch('http://localhost:8000/api/v1/sync/delta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': mutation.idempotencyKey,
          },
          body: JSON.stringify({
            state_id: mutation.stateId || 'workspace-default',
            expected_version: mutation.expectedVersion || 1,
            delta_diff: mutation.diff || {},
            device_id: mutation.deviceId || 'local-client',
          }),
        });

        if (res.status === 409) {
          // Conflict detected!
          const conflictData = await res.json();
          this._notifyConflict({
            mutation,
            serverState: conflictData.server_state,
            serverVersion: conflictData.server_version,
          });
        } else if (!res.ok) {
          remaining.push(mutation);
        }
      } catch (err) {
        remaining.push(mutation);
      }
    }

    this._saveQueue(remaining);
    this._notifyListeners();
  }

  _saveQueue(queue) {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  subscribeConflict(callback) {
    this.conflictListeners.add(callback);
    return () => this.conflictListeners.delete(callback);
  }

  _notifyListeners() {
    const queue = this.getPendingQueue();
    this.listeners.forEach((cb) => cb({ isOnline: this.isOnline, pendingCount: queue.length, queue }));
  }

  _notifyConflict(conflictPayload) {
    this.conflictListeners.forEach((cb) => cb(conflictPayload));
  }
}

export const offlineOutbox = new OfflineOutboxManager();
