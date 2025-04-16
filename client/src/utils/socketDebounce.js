// Socket patching module to fix infinite requests

/**
 * Maintains a record of recent socket requests to prevent duplicates
 */
const recentRequests = new Map();

/**
 * Debounces socket requests to prevent infinite loops
 * @param {Object} socket - The socket.io client instance
 * @param {string} eventName - The event name to emit
 * @param {Object} data - The data to send
 * @param {number} debounceTime - The time in ms to debounce (default: 2000ms)
 * @returns {boolean} - Whether the request was sent or debounced
 */
export const debouncedEmit = (socket, eventName, data, debounceTime = 2000) => {
  if (!socket || !socket.connected) {
    console.error(`Cannot emit ${eventName}: Socket not connected`);
    return false;
  }

  const now = Date.now();
  // Stringify with stable keys to ensure consistent hashing regardless of object property order
  const stableStringify = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return JSON.stringify(obj);
    }
    const sortedKeys = Object.keys(obj).sort();
    const result = {};
    for (const key of sortedKeys) {
      result[key] = obj[key];
    }
    return JSON.stringify(result);
  };
  
  const requestKey = `${eventName}-${stableStringify(data)}`;
  const lastRequest = recentRequests.get(requestKey);

  if (lastRequest && (now - lastRequest < debounceTime)) {
    console.log(`Debounced ${eventName} request: too frequent (last request ${now - lastRequest}ms ago)`);
    return false;
  }

  // Update the request timestamp
  recentRequests.set(requestKey, now);
  
  // Clean up old entries
  if (recentRequests.size > 100) {
    // Keep only the 50 most recent requests
    const entries = [...recentRequests.entries()];
    entries.sort((a, b) => b[1] - a[1]); // Sort by timestamp (newest first)
    
    const toKeep = entries.slice(0, 50);
    recentRequests.clear();
    
    for (const [key, timestamp] of toKeep) {
      recentRequests.set(key, timestamp);
    }
  }

  // Emit the event
  console.log(`Emitting ${eventName} with data:`, data);
  try {
    socket.emit(eventName, data);
    return true;
  } catch (err) {
    console.error(`Error emitting ${eventName}:`, err);
    return false;
  }
};

/**
 * Adds debouncing to all socket methods to prevent infinite loops
 * @param {Object} socket - The socket.io client instance to patch
 */
export const patchSocketForSafety = (socket) => {
  if (!socket) return;
  
  // Skip if already patched
  if (socket._isPatched) return;
  
  // Save the original emit method
  const originalEmit = socket.emit;
  
  // Replace emit with a safer version
  socket.emit = function(eventName, ...args) {
    // Skip intercepting system events and special events
    if (eventName.startsWith('connect') || 
        eventName === 'disconnect' || 
        eventName === 'error' || 
        eventName === 'ping' || 
        eventName === 'pong') {
      return originalEmit.apply(socket, [eventName, ...args]);
    }
    
    // More conservative logging to prevent console spam
    if (!eventName.includes('typing')) { // Skip typing events which can be frequent
      console.log(`Safe emit: ${eventName}`);
    }
    
    // Check for potential infinite loops
    const now = Date.now();
    const key = `${eventName}-${socket.id}`;
    
    if (!socket._recentEmits) {
      socket._recentEmits = {};
    }
    
    // Check for excessive frequency - stricter limits
    if (socket._recentEmits[key]) {
      const { count, firstCall } = socket._recentEmits[key];
      const timeWindow = now - firstCall;
      
      // If more than 8 identical calls in 3 seconds or more than 20 in 10 seconds, this might be a loop
      if ((count > 8 && timeWindow < 3000) || (count > 20 && timeWindow < 10000)) {
        console.error(`Potential infinite loop detected: ${eventName} called ${count} times in ${timeWindow}ms`);
        console.error('Breaking potential infinite loop - call blocked');
        
        // Block all events of this type for a cooling period
        socket._blockUntil = now + 5000; // Block for 5 seconds
        socket._blockedEvent = eventName;
        
        return socket;
      }
      
      // If this event type is currently blocked
      if (socket._blockUntil && socket._blockedEvent === eventName && now < socket._blockUntil) {
        console.warn(`Event ${eventName} blocked during cooling period`);
        return socket;
      }
      
      // Update counters
      socket._recentEmits[key].count++;
      
      // Reset counter after 10 seconds
      if (timeWindow > 10000) {
        socket._recentEmits[key] = { count: 1, firstCall: now };
      }
    } else {
      // First call of this type
      socket._recentEmits[key] = { count: 1, firstCall: now };
    }
    
    // Proceed with the emit
    try {
      return originalEmit.apply(socket, [eventName, ...args]);
    } catch (err) {
      console.error(`Error in socket.emit for ${eventName}:`, err);
      return socket;
    }
  };
  
  // Also patch the on method to prevent duplicate handlers
  const originalOn = socket.on;
  socket._handlers = socket._handlers || {};
  
  socket.on = function(eventName, handler) {
    // Skip special handling for system events
    if (eventName.startsWith('connect') || eventName === 'disconnect' || eventName === 'error') {
      return originalOn.apply(socket, [eventName, handler]);
    }
    
    // Remove existing handlers for this event to prevent duplicates
    if (socket._handlers[eventName]) {
      socket.off(eventName, socket._handlers[eventName]);
    }
    
    // Store the new handler
    socket._handlers[eventName] = handler;
    
    // Call the original on method
    return originalOn.apply(socket, [eventName, handler]);
  };
  
  socket._isPatched = true;
  console.log('Socket patched for safety');
};

export default {
  debouncedEmit,
  patchSocketForSafety
}; 