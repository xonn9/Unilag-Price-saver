/**
 * User dashboard entrypoint (ES module)
 * - Loads categories/prices
 * - Handles navigation, filters, alerts and submissions
 */
import { API_URL } from './api_url.js';
import { getSession, getUserData, saveUserData } from './storage.js';
import { formatCurrency, safeHTML, appPath } from './utils.js';

let allPrices = [];
let allCategories = [];
let priceAlerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  guardAccess();
  setupNav();
  setupFilters();
  setupAlerts();
  setupLocationModal();
  bindFormSubmit();
  loadInitialData();
});

function guardAccess() {
  const session = getSession();
  if (!session.role || session.role !== 'user' || !session.token) {
    window.location.href = appPath('login.html');
  }
}

function setupNav() {
  const navToggleBtn = document.getElementById('navToggleBtn');
  const navPanel = document.getElementById('navPanel');
  const navOverlay = document.getElementById('navOverlay');
  const mobileNav = document.getElementById('mobileBottomNav');

  navToggleBtn?.addEventListener('click', () => {
    navPanel.classList.toggle('open');
    navOverlay.classList.toggle('open');
  });
  navOverlay?.addEventListener('click', () => {
    navPanel.classList.remove('open');
    navOverlay.classList.remove('open');
  });

  navPanel?.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action) {
      navPanel.classList.remove('open');
      navOverlay.classList.remove('open');
      handleNavAction(action);
    }
  });
  mobileNav?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      const action = btn.dataset.action;
      // Update active state for mobile nav
      mobileNav.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
      if (action === 'home') {
        btn.classList.add('active');
      }
      handleNavAction(action);
    }
  });

  const darkModeBtn = document.getElementById('darkModeBtn');
  if (darkModeBtn) {
    const applyPref = () => {
      const isDark = localStorage.getItem('dashboardDark') === 'true';
      document.body.classList.toggle('dark-mode', isDark);
      darkModeBtn.textContent = isDark ? '☀️' : '🌙';
    };
    applyPref();
    darkModeBtn.addEventListener('click', () => {
      const isDark = !(localStorage.getItem('dashboardDark') === 'true');
      localStorage.setItem('dashboardDark', isDark);
      applyPref();
    });
  }
  
  // Close modal buttons
  document.getElementById('categoryInsightsClose')?.addEventListener('click', () => closeModal('categoryInsightsModal'));
  document.getElementById('profileCloseBtn')?.addEventListener('click', () => closeModal('profileModal'));
}

// Modal and navigation handlers
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
}

function handleNavAction(action) {
  switch (action) {
    case 'home':
      document.querySelector('.mobile-nav-item[data-action="home"]')?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'trends':
    case 'insights':
      populateCategoryInsights();
      openModal('categoryInsightsModal');
      break;
    case 'alerts':
      openModal('alertModal');
      break;
    case 'profile':
      populateProfileModal();
      openModal('profileModal');
      break;
    case 'logout':
      localStorage.clear();
      window.location.href = appPath('login.html');
      break;
    case 'submit':
      document.getElementById('priceForm')?.scrollIntoView({ behavior: 'smooth' });
      break;
    case 'map':
      openModal('locationModal');
      break;
    default:
      console.log('nav action:', action);
      break;
  }
}

function populateCategoryInsights() {
  const content = document.getElementById('categoryInsightsContent');
  if (!content) return;
  
  const insights = allCategories.map(cat => {
    const catPrices = allPrices.filter(p => p.category_id === cat.id);
    const avgPrice = catPrices.length 
      ? (catPrices.reduce((sum, p) => sum + (p.price || 0), 0) / catPrices.length).toFixed(2)
      : 0;
    const count = catPrices.length;
    return `
      <div style="padding:1rem;border-bottom:1px solid #ddd;">
        <h4>${cat.icon || ''} ${cat.name}</h4>
        <p>Total Prices: ${count}</p>
        <p>Average Price: ${formatCurrency(parseFloat(avgPrice))}</p>
      </div>
    `;
  }).join('');
  
  content.innerHTML = insights || '<p>No category data available yet.</p>';
}

function populateProfileModal() {
  const content = document.getElementById('profileContent');
  if (!content) return;
  
  const session = getSession();
  const userData = getUserData();
  const submissions = allPrices.filter(p => p.submitted_by === parseInt(session.id || '0'));
  const submissionCount = submissions.length;
  
  content.innerHTML = `
    <div style="padding:1rem;">
      <h4>👤 ${safeHTML(session.name || 'User')}</h4>
      <p><strong>Role:</strong> ${safeHTML(session.role || 'user')}</p>
      <p><strong>Total Submissions:</strong> ${submissionCount}</p>
      <p><strong>Account Status:</strong> Active</p>
    </div>
  `;
}

function setupFilters() {
  ['filterCategory','filterMinPrice','filterMaxPrice','filterRetailer','filterLocation'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
    document.getElementById(id)?.addEventListener('change', applyFilters);
  });
  document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterMinPrice').value = '';
    document.getElementById('filterMaxPrice').value = '';
    document.getElementById('filterRetailer').value = '';
    document.getElementById('filterLocation').value = '';
    displayPrices(allPrices);
  });

  const searchInput = document.getElementById('globalSearch');
  const resultsDiv = document.getElementById('searchResults');
  let timeout;
  searchInput?.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) { resultsDiv?.classList.remove('open'); displayPrices(allPrices); return; }
      const filtered = allPrices.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.retailer && p.retailer.toLowerCase().includes(q)) ||
        (p.location && p.location.toLowerCase().includes(q))
      );
      resultsDiv.innerHTML = filtered.slice(0,6).map(p => `<div class="search-result-item" data-name="${safeHTML(p.name)}">${safeHTML(p.name)} — ${formatCurrency(p.price)}</div>`).join('') || '<div class="search-result-item">No results</div>';
      resultsDiv.classList.add('open');
      resultsDiv.querySelectorAll('.search-result-item').forEach(item => item.addEventListener('click', () => {
        const name = item.dataset.name;
        searchInput.value = name;
        resultsDiv.classList.remove('open');
        displayPrices(allPrices.filter(p => p.name === name));
      }));
    }, 200);
  });
}

function applyFilters() {
  const categoryId = document.getElementById('filterCategory').value;
  const minPrice = parseFloat(document.getElementById('filterMinPrice').value) || 0;
  const maxPrice = parseFloat(document.getElementById('filterMaxPrice').value) || Number.POSITIVE_INFINITY;
  const retailer = document.getElementById('filterRetailer').value.toLowerCase();
  const location = document.getElementById('filterLocation').value.toLowerCase();

  const filtered = allPrices.filter(p => {
    const matchCategory = !categoryId || String(p.category_id) === String(categoryId);
    const matchPrice = typeof p.price === 'number' && p.price >= minPrice && p.price <= maxPrice;
    const matchRetailer = !retailer || (p.retailer && p.retailer.toLowerCase().includes(retailer));
    const matchLocation = !location || (p.location && p.location.toLowerCase().includes(location));
    return matchCategory && matchPrice && matchRetailer && matchLocation;
  });
  displayPrices(filtered);
}

function setupAlerts() {
  document.getElementById('alertSaveBtn')?.addEventListener('click', savePriceAlert);
  document.getElementById('alertCancelBtn')?.addEventListener('click', () => closeModal('alertModal'));
}

function savePriceAlert() {
  const itemName = document.getElementById('alertItemName').value.trim();
  const threshold = parseFloat(document.getElementById('alertThreshold').value);
  if (!itemName || Number.isNaN(threshold)) { alert('Please fill all alert fields'); return; }
  priceAlerts.push({ id: Date.now(), itemName, threshold, triggered:false });
  localStorage.setItem('priceAlerts', JSON.stringify(priceAlerts));
  closeModal('alertModal');
  updateAlertBadges();
}

function checkPriceAlerts(prices) {
  priceAlerts.forEach(alert => {
    if (alert.triggered) return;
    const hit = prices.find(p => p.name?.toLowerCase() === alert.itemName.toLowerCase() && p.price <= alert.threshold);
    if (hit) {
      alert.triggered = true;
      showToast(`Price alert: ${alert.itemName} is now ${formatCurrency(hit.price)}`);
    }
  });
  localStorage.setItem('priceAlerts', JSON.stringify(priceAlerts));
  updateAlertBadges();
}

function updateAlertBadges() {
  const active = priceAlerts.filter(a => !a.triggered).length;
  document.querySelectorAll('.alert-badge').forEach(badge => {
    badge.textContent = active ? active : '';
    badge.classList.toggle('active', active > 0);
  });
}

function showToast(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:80px;right:20px;background:#34C759;color:#fff;padding:1rem;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.2);z-index:2000;';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function setupLocationModal() {
  const mapBtn = document.getElementById('mapPickerBtn');
  mapBtn?.addEventListener('click', () => openModal('locationModal'));
  document.getElementById('locationModalClose')?.addEventListener('click', () => closeModal('locationModal'));
  document.getElementById('locationModalCancel')?.addEventListener('click', () => closeModal('locationModal'));
  document.getElementById('locationModalConfirm')?.addEventListener('click', () => {
    const manual = document.getElementById('manualLocation').value.trim();
    if (manual) {
      document.getElementById('location').value = manual;
      closeModal('locationModal');
      document.getElementById('manualLocation').value = '';
    } else {
      alert('Enter a location or pick on the map');
    }
  });
}

function bindFormSubmit() {
  const form = document.getElementById('priceForm');
  form?.addEventListener('submit', onSubmitPrice);
}

async function onSubmitPrice(e) {
  e.preventDefault();
  const payload = {
    category_id: parseInt(document.getElementById('category').value) || null,
    name: document.getElementById('itemName').value.trim(),
    brand: document.getElementById('brand').value.trim() || null,
    pack_size: document.getElementById('packSize').value.trim() || null,
    pack_unit: document.getElementById('packUnit').value || null,
    price: parseFloat(document.getElementById('price').value),
    price_per_unit: parseFloat(document.getElementById('pricePerUnit').value) || null,
    retailer: document.getElementById('retailer').value.trim() || null,
    location: document.getElementById('location').value.trim() || null,
    store_id: null,
    submitted_by: getSession().id ? parseInt(getSession().id) : null
  };

  if (!payload.category_id || !payload.name || Number.isNaN(payload.price)) {
    alert('Please provide category, item name and price.');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/items/prices/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Unable to submit price');
    document.getElementById('successMsg').classList.add('show');
    setTimeout(() => document.getElementById('successMsg').classList.remove('show'), 3000);
    form.reset();
  await loadPrices();
  } catch (err) {
    alert('Error submitting price: ' + err.message);
  }
}

async function loadInitialData() {
  await Promise.all([loadCategories(), loadPrices()]);
  updateUserInfo();
}

async function loadCategories() {
  try {
    const res = await fetch(`${API_URL}/items/categories/all`);
    const cats = await res.json();
    allCategories = Array.isArray(cats) ? cats : [];
    const catSelect = document.getElementById('category');
    const filterSelect = document.getElementById('filterCategory');
    catSelect.innerHTML = '<option value="">Select category...</option>';
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    allCategories.forEach(cat => {
      const opt1 = document.createElement('option');
      opt1.value = cat.id;
      opt1.textContent = `${cat.icon || ''} ${cat.name}`;
      const opt2 = opt1.cloneNode(true);
      catSelect.appendChild(opt1);
      filterSelect.appendChild(opt2);
    });
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

async function loadPrices() {
  try {
    const res = await fetch(`${API_URL}/items/prices/all`);
    const prices = await res.json();
    allPrices = Array.isArray(prices) ? prices : [];
    displayPrices(allPrices);
    updateStats(allPrices);
    checkPriceAlerts(allPrices);
  } catch (err) {
    console.error('Failed to load prices', err);
  }
}

function displayPrices(prices) {
  const container = document.getElementById('pricesContainer');
  if (!container) return;
  if (!prices.length) {
    container.innerHTML = '<div class="empty-state"><p>No prices available yet. Start by submitting a price above!</p></div>';
    return;
  }

  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    container.innerHTML = prices.map(p => {
      const cat = allCategories.find(c => c.id === p.category_id);
      return `
        <article class="price-card" data-id="${p.id}">
          <div class="price-card-header">
            <span class="category-badge">${cat?.icon || ''} ${cat?.name || 'Unknown'}</span>
            <h4>${safeHTML(p.name)}</h4>
            <button class="alert-bell" data-name="${safeHTML(p.name)}" title="Set Alert">🔔<span class="alert-badge"></span></button>
          </div>
          <div class="price-amount">${formatCurrency(p.price)}</div>
          <div class="price-meta">
            ${p.brand ? `<div>Brand: ${safeHTML(p.brand)}</div>` : ''}
            ${p.pack_size ? `<div>Pack: ${safeHTML(p.pack_size)}${p.pack_unit ? ' ' + safeHTML(p.pack_unit) : ''}</div>` : ''}
            ${p.price_per_unit ? `<div>Per Unit: ${formatCurrency(p.price_per_unit)}</div>` : ''}
          </div>
          <div class="price-footer">
            <a href="#" class="retailer-link" data-retailer="${safeHTML(p.retailer || '')}">🏪 ${safeHTML(p.retailer || '-')}</a>
            <div>📍 ${safeHTML(p.location || '-')}</div>
            <div class="small-date">${p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : ''}</div>
          </div>
        </article>
      `;
    }).join('');
  } else {
    const table = document.createElement('table');
    table.className = 'prices-table';
    table.innerHTML = `
      <thead>
        <tr><th>Category</th><th>Item</th><th>Brand</th><th>Pack</th><th>Price</th><th>Per Unit</th><th>Retailer</th><th>Location</th><th>Date</th></tr>
      </thead>
      <tbody>
        ${prices.map(p => {
          const cat = allCategories.find(c => c.id === p.category_id);
          return `
            <tr>
              <td><span class="category-badge">${cat?.icon || ''} ${cat?.name || 'Unknown'}</span></td>
              <td>${safeHTML(p.name)} <button class="alert-bell" data-name="${safeHTML(p.name)}" title="Set Alert">🔔<span class="alert-badge"></span></button></td>
              <td>${safeHTML(p.brand || '-')}</td>
              <td>${p.pack_size ? `${safeHTML(p.pack_size)}${p.pack_unit ? ' ' + safeHTML(p.pack_unit) : ''}` : '-'}</td>
              <td class="price-value">${formatCurrency(p.price)}</td>
              <td>${p.price_per_unit ? formatCurrency(p.price_per_unit) : '-'}</td>
              <td><a href="#" class="retailer-link" data-retailer="${safeHTML(p.retailer || '')}">${safeHTML(p.retailer || '-')}</a></td>
              <td>${safeHTML(p.location || '-')}</td>
              <td>${p.submitted_at ? new Date(p.submitted_at).toLocaleDateString() : ''}</td>
            </tr>
          `;
        }).join('')}
      </tbody>`;
    container.innerHTML = '';
    container.appendChild(table);
  }

  // Wire alert buttons
    container.querySelectorAll('.alert-bell').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
    document.getElementById('alertItemName').value = btn.dataset.name;
    openModal('alertModal');
  }));

  // Wire retailer links
  container.querySelectorAll('.retailer-link').forEach(link => link.addEventListener('click', (e) => {
    e.preventDefault();
    showToast(`Retailer: ${link.dataset.retailer || 'N/A'}`);
  }));

  updateAlertBadges();
}

function updateStats(prices) {
  document.getElementById('totalPrices').textContent = prices.length;
  const avg = prices.length ? (prices.reduce((sum, p) => sum + (p.price || 0), 0) / prices.length) : 0;
  document.getElementById('avgPrice').textContent = formatCurrency(avg);
  document.getElementById('totalLocations').textContent = new Set(prices.map(p => p.location).filter(Boolean)).size;
  document.getElementById('totalRetailers').textContent = new Set(prices.map(p => p.retailer).filter(Boolean)).size;
}

function updateUserInfo() {
  const session = getSession();
  const userName = session.name || 'Student';
  const userData = getUserData();
  const submissionCount = (userData?.submissions || []).length;
  const score = Math.min(5, 3 + submissionCount * 0.1).toFixed(1);
  document.getElementById('user-info').innerHTML = `User: ${safeHTML(userName)} • ⭐ ${score}`;
  if (userData) {
    userData.reputation = { score, badge: score >= 4.5 ? 'Trusted User' : score >= 3.5 ? 'Active' : 'New User' };
    saveUserData(userData);
  }
}

