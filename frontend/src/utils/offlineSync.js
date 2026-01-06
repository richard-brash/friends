/**
 * Offline Sync Queue
 * Handles offline-first operations with background synchronization
 * Uses IndexedDB for persistent queue storage
 */

const DB_NAME = 'friendsOutreachOffline';
const DB_VERSION = 1;
const QUEUE_STORE = 'syncQueue';
const RETRY_INTERVAL = 30000; // 30 seconds

class OfflineSyncQueue {
  constructor() {
    this.db = null;
    this.retryTimer = null;
    this.syncing = false;
    this.listeners = [];
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.startRetryLoop();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create sync queue store
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
          const store = db.createObjectStore(QUEUE_STORE, { 
            keyPath: 'id',
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  /**
   * Add action to queue (optimistic update)
   */
  async queueAction(action) {
    if (!this.db) await this.init();

    const queueItem = {
      ...action,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
      lastError: null
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.add(queueItem);

      request.onsuccess = () => {
        const id = request.result;
        this.notifyListeners({ type: 'queued', itemId: id });
        
        // Try to sync immediately
        this.processQueue();
        
        resolve(id);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Process all pending items in queue
   */
  async processQueue() {
    if (this.syncing) return; // Already processing
    if (!navigator.onLine) return; // Offline

    this.syncing = true;
    this.notifyListeners({ type: 'syncStart' });

    try {
      const items = await this.getPendingItems();
      
      for (const item of items) {
        try {
          await this.executeAction(item);
          await this.removeItem(item.id);
          this.notifyListeners({ type: 'synced', itemId: item.id });
        } catch (error) {
          // Update retry count
          await this.updateItemError(item.id, error.message);
          this.notifyListeners({ type: 'syncError', itemId: item.id, error });
          
          // If too many retries, mark as failed
          if (item.retries >= 5) {
            await this.markAsFailed(item.id);
          }
        }
      }
    } finally {
      this.syncing = false;
      
      const remaining = await this.getPendingCount();
      this.notifyListeners({ type: 'syncEnd', remaining });
    }
  }

  /**
   * Execute a queued action
   */
  async executeAction(item) {
    const { type, payload } = item;
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    let response;

    switch (type) {
      case 'START_RUN':
        response = await fetch(`/api/v2/execution/${payload.runId}/start`, {
          method: 'POST',
          headers
        });
        break;

      case 'ADVANCE_STOP':
        response = await fetch(`/api/v2/execution/${payload.runId}/advance`, {
          method: 'POST',
          headers
        });
        break;

      case 'PREVIOUS_STOP':
        response = await fetch(`/api/v2/execution/${payload.runId}/previous`, {
          method: 'POST',
          headers
        });
        break;

      case 'RECORD_DELIVERY':
        response = await fetch(`/api/v2/execution/${payload.runId}/stop-delivery`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            locationId: payload.locationId,
            mealsDelivered: payload.mealsDelivered,
            notes: payload.notes
          })
        });
        break;

      case 'SPOT_FRIEND':
        response = await fetch(`/api/v2/execution/${payload.runId}/spot-friend`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            friendId: payload.friendId,
            locationId: payload.locationId,
            notes: payload.notes
          })
        });
        break;

      case 'MARK_DELIVERED':
        response = await fetch(`/api/v2/requests/${payload.requestId}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'delivered',
            notes: payload.notes
          })
        });
        break;

      case 'DELIVERY_FAILED':
        response = await fetch(`/api/v2/requests/${payload.requestId}/delivery-failed`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            notes: payload.notes
          })
        });
        break;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return await response.json();
  }

  /**
   * Get all pending items
   */
  async getPendingItems() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE);
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get count of pending items
   */
  async getPendingCount() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUEUE_STORE], 'readonly');
      const store = transaction.objectStore(QUEUE_STORE);
      const index = store.index('status');
      const request = index.count('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove item from queue
   */
  async removeItem(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update item with error
   */
  async updateItemError(id, errorMessage) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.retries = (item.retries || 0) + 1;
          item.lastError = errorMessage;
          item.lastRetry = Date.now();
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve(); // Item already removed
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Mark item as permanently failed
   */
  async markAsFailed(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.status = 'failed';
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Start retry loop
   */
  startRetryLoop() {
    if (this.retryTimer) return;

    this.retryTimer = setInterval(() => {
      if (navigator.onLine && !this.syncing) {
        this.processQueue();
      }
    }, RETRY_INTERVAL);

    // Also retry when coming back online
    window.addEventListener('online', () => {
      this.processQueue();
    });
  }

  /**
   * Stop retry loop
   */
  stopRetryLoop() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Subscribe to sync events
   */
  subscribe(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Clear all queued items (for testing/debugging)
   */
  async clearQueue() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([QUEUE_STORE], 'readwrite');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
const syncQueue = new OfflineSyncQueue();

export default syncQueue;
