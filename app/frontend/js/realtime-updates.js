/**
 * UNILAG Price Saver - Real-time Price Updates
 * WebSocket-based live price feed
 */

class PriceUpdater {
  constructor(apiUrl = "http://localhost:8000") {
    this.apiUrl = apiUrl;
    this.ws = null;
    this.subscribers = new Map();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to WebSocket and listen for price updates
   */
  connect() {
    if (this.ws || this.isConnecting) return Promise.resolve();

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.apiUrl.replace(/^http/, "ws") + "/ws/prices";
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log("✅ Connected to live price updates");
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handlePriceUpdate(data);
          } catch (e) {
            console.error("Error parsing WebSocket message:", e);
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("WebSocket connection closed");
          this.ws = null;
          this.isConnecting = false;
          this.attemptReconnect();
        };
      } catch (e) {
        this.isConnecting = false;
        reject(e);
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("Max reconnection attempts reached");
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
    setTimeout(() => this.connect().catch(console.error), delay);
  }

  /**
   * Subscribe to price updates for a specific item
   * @param {number} itemId - Item ID to subscribe to
   * @param {function} callback - Callback function to call on updates
   * @returns {function} Unsubscribe function
   */
  subscribe(itemId, callback) {
    if (!this.subscribers.has(itemId)) {
      this.subscribers.set(itemId, new Set());
    }

    this.subscribers.get(itemId).add(callback);

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(itemId);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(itemId);
        }
      }
    };
  }

  /**
   * Handle incoming price update and notify subscribers
   */
  handlePriceUpdate(data) {
    const { item_id, item_name, store_name, price, timestamp } = data;

    // Notify specific item subscribers
    if (this.subscribers.has(item_id)) {
      this.subscribers.get(item_id).forEach((callback) => {
        try {
          callback({
            itemId: item_id,
            itemName: item_name,
            storeName: store_name,
            price,
            timestamp: new Date(timestamp),
          });
        } catch (e) {
          console.error("Error in price update callback:", e);
        }
      });
    }

    // Notify global subscribers (item_id = 0)
    if (this.subscribers.has(0)) {
      this.subscribers.get(0).forEach((callback) => {
        try {
          callback({
            itemId: item_id,
            itemName: item_name,
            storeName: store_name,
            price,
            timestamp: new Date(timestamp),
          });
        } catch (e) {
          console.error("Error in price update callback:", e);
        }
      });
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = PriceUpdater;
}

/**
 * ========== USAGE EXAMPLES ==========
 * 
 * // Initialize updater
 * const priceUpdater = new PriceUpdater("http://localhost:8000");
 * await priceUpdater.connect();
 * 
 * // Subscribe to all price updates
 * priceUpdater.subscribe(0, (update) => {
 *   console.log(`${update.itemName} now ₦${update.price} at ${update.storeName}`);
 * });
 * 
 * // Subscribe to specific item
 * priceUpdater.subscribe(123, (update) => {
 *   // Update UI with new price
 *   document.querySelector(`[data-item-id="123"]`).textContent = `₦${update.price}`;
 * });
 * 
 * // Unsubscribe
 * const unsubscribe = priceUpdater.subscribe(123, callback);
 * unsubscribe();
 */
