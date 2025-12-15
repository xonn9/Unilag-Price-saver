/**
 * Enhanced Utility Functions with Better Error Handling
 */

// Error handling wrapper
export function withErrorHandling(fn, errorMessage = 'An error occurred') {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      console.error(`${errorMessage}:`, error);
      showToast(errorMessage, 'error');
      return null;
    }
  };
}

// Safe fetch with retry logic
export async function safeFetch(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// Format currency
export function formatCurrency(amount) {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  return `₦${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

// Safely escape HTML to prevent XSS
export function safeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Enhanced Toast with Icons
export function showToast(message, type = 'info', duration = 4000) {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  const colors = {
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#667eea'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    max-width: 400px;
    font-weight: 500;
  `;

  const icon = document.createElement('span');
  icon.textContent = icons[type] || icons.info;
  icon.style.cssText = 'font-size: 1.5rem; font-weight: bold;';

  const text = document.createElement('span');
  text.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(text);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Loading spinner
export function showLoading(element, show = true) {
  if (!element) return;
  
  if (show) {
    element.style.opacity = '0.6';
    element.style.pointerEvents = 'none';
    
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border: 4px solid rgba(102, 126, 234, 0.2);
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;
    
    element.style.position = 'relative';
    element.appendChild(spinner);
  } else {
    element.style.opacity = '1';
    element.style.pointerEvents = 'auto';
    const spinner = element.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
  }
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Validate form fields with detailed error messages
export function validateField(value, rules = {}) {
  const errors = [];
  
  if (rules.required && !value?.trim()) {
    errors.push('This field is required');
  }
  
  if (rules.minLength && value?.length < rules.minLength) {
    errors.push(`Minimum ${rules.minLength} characters required`);
  }
  
  if (rules.maxLength && value?.length > rules.maxLength) {
    errors.push(`Maximum ${rules.maxLength} characters allowed`);
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.patternMessage || 'Invalid format');
  }
  
  if (rules.min !== undefined && parseFloat(value) < rules.min) {
    errors.push(`Minimum value is ${rules.min}`);
  }
  
  if (rules.max !== undefined && parseFloat(value) > rules.max) {
    errors.push(`Maximum value is ${rules.max}`);
  }
  
  if (rules.email && value && !isValidEmail(value)) {
    errors.push('Invalid email address');
  }
  
  return errors;
}

// Email validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Show field error
export function showFieldError(fieldId, errors) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  // Remove existing error
  const existingError = field.parentElement.querySelector('.field-error');
  if (existingError) existingError.remove();
  
  if (errors.length > 0) {
    field.style.borderColor = '#FF3B30';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.cssText = `
      color: #FF3B30;
      font-size: 0.85rem;
      margin-top: 0.3rem;
      animation: fadeIn 0.3s;
    `;
    errorDiv.textContent = errors[0];
    
    field.parentElement.appendChild(errorDiv);
  } else {
    field.style.borderColor = '';
  }
}

// Clear field error
export function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  field.style.borderColor = '';
  const error = field.parentElement.querySelector('.field-error');
  if (error) error.remove();
}

// Disable/enable button with loading state
export function disableButton(btn, disabled = true, text = null) {
  if (!btn) return;
  
  btn.disabled = disabled;
  
  if (disabled) {
    btn.dataset.originalText = btn.textContent;
    btn.innerHTML = `
      <span style="display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top: 2px solid white; border-radius: 50%; animation: spin .8s linear infinite; margin-right: 8px;"></span>
      ${text || 'Loading...'}
    `;
  } else {
    btn.textContent = btn.dataset.originalText || text || 'Submit';
  }
}

// Show status message
export function showStatus(el, type, message) {
  if (!el) return;
  el.className = `status-message ${type}`;
  el.textContent = message;
}

// Resolve path for different deployments
export function appPath(page = '') {
  const base = window.location.pathname.includes('/Frontend/') ? '/Frontend/' : '/';
  return `${base}${page}`;
}

// Local storage with error handling
export function safeLocalStorage(operation, key, value = null) {
  try {
    switch(operation) {
      case 'get':
        return localStorage.getItem(key);
      case 'set':
        localStorage.setItem(key, value);
        return true;
      case 'remove':
        localStorage.removeItem(key);
        return true;
      case 'clear':
        localStorage.clear();
        return true;
      default:
        return null;
    }
  } catch (error) {
    console.error('localStorage error:', error);
    showToast('Storage unavailable. Some features may not work.', 'warning');
    return null;
  }
}

// Parse JSON safely
export function safeJSONParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

// Format date
export function formatDate(date, format = 'short') {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  switch(format) {
    case 'short':
      return d.toLocaleDateString();
    case 'long':
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'time':
      return d.toLocaleTimeString();
    case 'full':
      return d.toLocaleString();
    default:
      return d.toLocaleDateString();
  }
}

// Calculate time ago
export function timeAgo(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const seconds = Math.floor((new Date() - d) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

// Confirm dialog with custom styling
export function confirmDialog(message, onConfirm, onCancel = null) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s;
  `;
  
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 20px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    animation: slideUp 0.3s;
  `;
  
  dialog.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
      <h3 style="margin-bottom: 1rem;">${safeHTML(message)}</h3>
      <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <button id="cancelBtn" style="flex: 1; padding: 0.8rem; background: #888; color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Cancel</button>
        <button id="confirmBtn" style="flex: 1; padding: 0.8rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; cursor: pointer; font-weight: 600;">Confirm</button>
      </div>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  const remove = () => {
    overlay.style.animation = 'fadeOut 0.3s';
    setTimeout(() => overlay.remove(), 300);
  };
  
  dialog.querySelector('#confirmBtn').onclick = () => {
    if (onConfirm) onConfirm();
    remove();
  };
  
  dialog.querySelector('#cancelBtn').onclick = () => {
    if (onCancel) onCancel();
    remove();
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      if (onCancel) onCancel();
      remove();
    }
  };
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  } catch (error) {
    console.error('Copy failed:', error);
    showToast('Failed to copy', 'error');
  }
}

// Download data as JSON
export function downloadJSON(data, filename = 'data.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Downloaded ${filename}`, 'success');
}

// Check if user is on mobile
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
    || window.innerWidth <= 768;
}

// Network status checker
export function checkNetworkStatus() {
  if (!navigator.onLine) {
    showToast('You are offline. Some features may not work.', 'warning', 6000);
    return false;
  }
  return true;
}

// Initialize network status listeners
export function initNetworkListeners() {
  window.addEventListener('online', () => {
    showToast('Connection restored!', 'success');
  });
  
  window.addEventListener('offline', () => {
    showToast('You are offline', 'warning', 6000);
  });
}

// Get user data with fallback
export function getUserData() {
  try {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : { submissions: [], reputation: { score: 3.0, badge: 'New User' } };
  } catch (e) {
    console.error('Error parsing userData:', e);
    return { submissions: [], reputation: { score: 3.0, badge: 'New User' } };
  }
}

// Save user data with validation
export function saveUserData(userData) {
  try {
    localStorage.setItem('userData', JSON.stringify(userData));
    return true;
  } catch (e) {
    console.error('Error saving userData:', e);
    showToast('Failed to save user data', 'error');
    return false;
  }
}

// Analytics helper
export function trackEvent(eventName, data = {}) {
  console.log('Event tracked:', eventName, data);
  // Add analytics integration here (Google Analytics, etc.)
}

// Hash password (for demo - use proper hashing in production)
export function hashPassword(password = '') {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}