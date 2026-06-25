/**
 * @fileoverview Main Logic, Routing and API Integration for Aura Directory SPA.
 * Fully modular Vanilla ES6 script implementing JSDoc standards.
 */

// ==========================================================================
//   APPLICATION STATE
// ==========================================================================

/**
 * @typedef {Object} UserLocation
 * @property {string} city
 * @property {string} state
 * @property {string} country
 */

/**
 * @typedef {Object} User
 * @property {string} gender
 * @property {Object} name
 * @property {string} name.title
 * @property {string} name.first
 * @property {string} name.last
 * @property {string} email
 * @property {string} phone
 * @property {string} cell
 * @property {string} nat
 * @property {Object} picture
 * @property {string} picture.large
 * @property {string} picture.medium
 * @property {string} picture.thumbnail
 * @property {Object} dob
 * @property {string} dob.date
 * @property {number} dob.age
 * @property {UserLocation} location
 */

/**
 * Global state storage for user directory data.
 * @type {{users: User[], filteredUsers: User[], currentFilterGender: string, currentSearchQuery: string}}
 */
const AppState = {
  users: [],
  filteredUsers: [],
  currentFilterGender: 'all',
  currentSearchQuery: ''
};

// ==========================================================================
//   DOM ELEMENTS CACHE
// ==========================================================================
const DOM = {
  html: document.documentElement,
  themeToggle: document.getElementById('theme-toggle'),
  menuToggle: document.getElementById('menu-toggle'),
  navMenu: document.getElementById('nav-menu'),
  navLinks: document.querySelectorAll('.nav-link'),
  viewSections: document.querySelectorAll('.view-section'),
  usersGrid: document.getElementById('users-grid'),
  searchInput: document.getElementById('search-input'),
  genderFilter: document.getElementById('gender-filter'),
  refreshUsersBtn: document.getElementById('refresh-users-btn'),
  userModal: document.getElementById('user-modal'),
  modalClose: document.getElementById('modal-close'),
  modalContent: document.getElementById('modal-content'),
  // Links references
  linkHome: document.getElementById('link-home'),
  linkUsers: document.getElementById('link-users'),
  linkAbout: document.getElementById('link-about')
};

// ==========================================================================
//   THEME MANAGER
// ==========================================================================

/**
 * Initialize theme based on LocalStorage or system user preference settings.
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    DOM.html.setAttribute('data-theme', savedTheme);
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    DOM.html.setAttribute('data-theme', initialTheme);
    localStorage.setItem('theme', initialTheme);
  }
}

/**
 * Toggles the application between Light and Dark themes.
 * Stores the selection in localStorage.
 */
function toggleTheme() {
  const currentTheme = DOM.html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  DOM.html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// ==========================================================================
//   MOBILE MENU (HAMBURGER)
// ==========================================================================

/**
 * Toggles the mobile menu active status.
 */
function toggleMobileMenu() {
  const isExpanded = DOM.menuToggle.getAttribute('aria-expanded') === 'true';
  DOM.menuToggle.setAttribute('aria-expanded', !isExpanded);
  DOM.menuToggle.classList.toggle('active');
  DOM.navMenu.classList.toggle('active');
}

/**
 * Closes the mobile navigation menu if it is currently open.
 */
function closeMobileMenu() {
  DOM.menuToggle.setAttribute('aria-expanded', 'false');
  DOM.menuToggle.classList.remove('active');
  DOM.navMenu.classList.remove('active');
}

// ==========================================================================
//   CLIENT-SIDE HASH ROUTER
// ==========================================================================

/**
 * Map showing relationship between hash URLs and DOM view section identifiers.
 * @type {Object<string, string>}
 */
const RouteMap = {
  '#/home': 'home-view',
  '#/users': 'users-view',
  '#/about': 'about-view'
};

/**
 * Router main logic checking active URL hash and toggling views inside DOM.
 */
function router() {
  let hash = window.location.hash;
  
  // Default fallback route configuration
  if (!hash || hash === '#' || hash === '#/') {
    hash = '#/home';
    window.location.hash = '#/home';
    return;
  }

  // Find target view section
  const targetSectionId = RouteMap[hash];
  
  if (targetSectionId) {
    // Deactivate all sections, activate matching view section
    DOM.viewSections.forEach(section => {
      section.classList.remove('active');
    });

    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update main header navbar link highlighters
    DOM.navLinks.forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close hamburger navigation on route navigation completion
    closeMobileMenu();

    // Trigger API directory loading on routing to users list if empty
    if (hash === '#/users' && AppState.users.length === 0) {
      loadTeamDirectory();
    }
  } else {
    // Route fallback to Home view for unrecognized URLs
    window.location.hash = '#/home';
  }
}

// ==========================================================================
//   API SERVICE LAYER
// ==========================================================================

/**
 * Fetches user data from Random User API.
 * @async
 * @returns {Promise<User[]>} Array of User Objects
 * @throws {Error} Network error or API failure message
 */
async function fetchUsers() {
  const url = 'https://randomuser.me/api/?results=8&nat=us';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP fetch error! Status: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}

// ==========================================================================
//   DOM RENDERING & COMPONENT BUILDERS
// ==========================================================================

/**
 * Renders user skeletons inside grid container during loader state triggers.
 */
function renderSkeletons() {
  let skeletonHtml = '';
  for (let i = 0; i < 8; i++) {
    skeletonHtml += `
      <div class="card-skeleton shimmer" aria-hidden="true">
        <div class="skeleton-avatar shimmer"></div>
        <div class="skeleton-name shimmer"></div>
        <div class="skeleton-badge shimmer"></div>
        <div class="skeleton-text shimmer"></div>
        <div class="skeleton-text-sm shimmer"></div>
      </div>
    `;
  }
  DOM.usersGrid.innerHTML = skeletonHtml;
}

/**
 * Renders error component fallback inside grid directory.
 * @param {string} errorMsg User-friendly message representation
 */
function renderErrorState(errorMsg) {
  DOM.usersGrid.innerHTML = `
    <div class="users-error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>Unable to load team directory</h3>
      <p>${errorMsg}</p>
      <button id="retry-btn" class="btn btn-primary">Try Again</button>
    </div>
  `;

  // Attach event listener immediately to dynamically created retry button
  document.getElementById('retry-btn').addEventListener('click', loadTeamDirectory);
}

/**
 * Renders empty state component when searches filter out all members.
 */
function renderEmptyState() {
  DOM.usersGrid.innerHTML = `
    <div class="users-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <h3>No matching team members found</h3>
      <p>Try refining your search terms or changing the gender filter selection.</p>
    </div>
  `;
}

/**
 * Formats user country flag code to uppercase string representation.
 * @param {string} countryCode Input ISO code from API
 * @returns {string} Formatted output
 */
function formatNat(countryCode) {
  return countryCode ? countryCode.toUpperCase() : 'US';
}

/**
 * Builds user card item HTML structures dynamically.
 * @param {User} user Original User object from API responses
 * @returns {HTMLElement} HTML element containing user information card setup
 */
function createUserCard(user) {
  const cardElement = document.createElement('div');
  cardElement.className = 'user-card';
  cardElement.setAttribute('tabindex', '0');
  cardElement.setAttribute('role', 'button');
  cardElement.setAttribute('aria-label', `View details for ${user.name.first} ${user.name.last}`);
  
  const formattedName = `${user.name.first} ${user.name.last}`;
  const genderClass = user.gender === 'male' ? 'male' : 'female';
  const genderSymbol = user.gender === 'male' ? '&#9794;' : '&#9792;';

  cardElement.innerHTML = `
    <div class="card-avatar-wrapper">
      <img class="card-avatar" src="${user.picture.large}" alt="${formattedName} Photo" loading="lazy">
      <div class="gender-indicator ${genderClass}" title="Gender: ${user.gender}">
        ${genderSymbol}
      </div>
    </div>
    <h3 class="card-name">${formattedName}</h3>
    <span class="card-nat-badge">${formatNat(user.nat)}</span>
    <p class="card-email">${user.email}</p>
    <p class="card-location">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
      <span>${user.location.city}, ${user.location.state}</span>
    </p>
  `;

  // Attach card detail overlay presentation modal hooks on interaction trigger
  const handleCardInteraction = () => openDetailsModal(user);
  cardElement.addEventListener('click', handleCardInteraction);
  cardElement.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardInteraction();
    }
  });

  return cardElement;
}

/**
 * Iterates through application states list, filters it, and outputs rendering grids.
 */
function renderUsersGrid() {
  DOM.usersGrid.innerHTML = '';
  
  if (AppState.filteredUsers.length === 0) {
    renderEmptyState();
    return;
  }

  // Fragment wrapper layout configuration for speed optimization limits
  const fragment = document.createDocumentFragment();
  AppState.filteredUsers.forEach(user => {
    const card = createUserCard(user);
    fragment.appendChild(card);
  });
  DOM.usersGrid.appendChild(fragment);
}

// ==========================================================================
//   LOADERS, SEARCH & FILTER PROCESSORS
// ==========================================================================

/**
 * Handles core loading and updates directory configurations inside app state.
 * @async
 */
async function loadTeamDirectory() {
  try {
    renderSkeletons();
    
    // Disable interaction selectors during async flow
    DOM.refreshUsersBtn.disabled = true;
    
    const results = await fetchUsers();
    
    AppState.users = results;
    applyFilters(); // Processes filtering and triggers UI updates
  } catch (error) {
    console.error('Directory fetch failed:', error);
    renderErrorState(error.message || 'Check your internet connection.');
  } finally {
    DOM.refreshUsersBtn.disabled = false;
  }
}

/**
 * Sync search query and gender inputs to generate filtered datasets for DOM rendering views.
 */
function applyFilters() {
  const query = AppState.currentSearchQuery.toLowerCase().trim();
  const gender = AppState.currentFilterGender;

  AppState.filteredUsers = AppState.users.filter(user => {
    // 1. Filter by Gender selection
    const matchesGender = (gender === 'all') || (user.gender === gender);
    
    // 2. Filter by search input match
    const fullName = `${user.name.first} ${user.name.last}`.toLowerCase();
    const email = user.email.toLowerCase();
    const city = user.location.city.toLowerCase();
    const country = user.location.country.toLowerCase();
    const state = user.location.state.toLowerCase();
    
    const matchesSearch = !query || 
      fullName.includes(query) ||
      email.includes(query) ||
      city.includes(query) ||
      country.includes(query) ||
      state.includes(query);

    return matchesGender && matchesSearch;
  });

  renderUsersGrid();
}

// ==========================================================================
//   DETAIL MODAL CONTROLLER
// ==========================================================================

/**
 * Opens modal directory details interface layout.
 * @param {User} user Selected User details map configuration
 */
function openDetailsModal(user) {
  const formattedName = `${user.name.first} ${user.name.last}`;
  const birthDate = new Date(user.dob.date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  DOM.modalContent.innerHTML = `
    <div class="modal-user-header">
      <img class="modal-avatar" src="${user.picture.large}" alt="${formattedName} photo">
      <h3 class="modal-name">${formattedName}</h3>
      <span class="card-nat-badge">${formatNat(user.nat)}</span>
      <p class="modal-title-desc">Registration Age: ${user.dob.age} years old</p>
    </div>
    
    <div class="modal-details-grid">
      <div class="modal-info-row">
        <div class="modal-info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <div class="modal-info-content">
          <span class="modal-info-label">Email Address</span>
          <span class="modal-info-value">${user.email}</span>
        </div>
      </div>

      <div class="modal-info-row">
        <div class="modal-info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
        </div>
        <div class="modal-info-content">
          <span class="modal-info-label">Phone Connection</span>
          <span class="modal-info-value">Landline: ${user.phone} <br> Mobile: ${user.cell}</span>
        </div>
      </div>

      <div class="modal-info-row">
        <div class="modal-info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div class="modal-info-content">
          <span class="modal-info-label">Location Address</span>
          <span class="modal-info-value">${user.location.street.number} ${user.location.street.name}, ${user.location.city}, ${user.location.state}, ${user.location.country} (${user.location.postcode})</span>
        </div>
      </div>

      <div class="modal-info-row">
        <div class="modal-info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="modal-info-content">
          <span class="modal-info-label">Date of Birth</span>
          <span class="modal-info-value">${birthDate}</span>
        </div>
      </div>
    </div>
  `;

  DOM.userModal.classList.add('active');
  DOM.userModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Stop background scrolling
  
  // Shift focus to close button for accessibility compliance
  DOM.modalClose.focus();
}

/**
 * Closes modal details drawer interface.
 */
function closeDetailsModal() {
  DOM.userModal.classList.remove('active');
  DOM.userModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = ''; // Resume viewport scroll controls
}

// ==========================================================================
//   EVENT LISTENERS & BINDINGS SETUP
// ==========================================================================

/**
 * Sets up routing structure, themes, hamburger actions, searches, and filters.
 */
function setupEventListeners() {
  // Theme Toggle Hook
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Mobile navigation drawer toggle triggers
  DOM.menuToggle.addEventListener('click', toggleMobileMenu);

  // Closing desktop menu drawer if clicks hit outside nav area bounds
  document.addEventListener('click', (e) => {
    const clickOnToggle = DOM.menuToggle.contains(e.target);
    const clickOnMenu = DOM.navMenu.contains(e.target);
    if (!clickOnToggle && !clickOnMenu && DOM.navMenu.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // Client-side Router Triggers
  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    router();
  });

  // Search input change listeners
  DOM.searchInput.addEventListener('input', (e) => {
    AppState.currentSearchQuery = e.target.value;
    applyFilters();
  });

  // Gender filter dropdown change listeners
  DOM.genderFilter.addEventListener('change', (e) => {
    AppState.currentFilterGender = e.target.value;
    applyFilters();
  });

  // Directory reload button click triggers
  DOM.refreshUsersBtn.addEventListener('click', loadTeamDirectory);

  // Details Modal close triggers
  DOM.modalClose.addEventListener('click', closeDetailsModal);
  DOM.userModal.addEventListener('click', (e) => {
    if (e.target === DOM.userModal) {
      closeDetailsModal();
    }
  });

  // Close modal dynamically if Escape key is pressed
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.userModal.classList.contains('active')) {
      closeDetailsModal();
    }
  });
}

// Run application triggers loading hooks
setupEventListeners();
