/**
 * @fileoverview Lógica Principal, Enrutamiento e Integración de API para la SPA Directorio Aura.
 * Script modular en Vanilla ES6 que implementa estándares JSDoc.
 */

// ==========================================================================
//   ESTADO DE LA APLICACIÓN
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
 * Almacenamiento del estado global para los datos del directorio de usuarios.
 * @type {{users: User[], filteredUsers: User[], currentFilterGender: string, currentSearchQuery: string}}
 */
const AppState = {
  users: [],
  filteredUsers: [],
  currentFilterGender: 'all',
  currentSearchQuery: ''
};

// ==========================================================================
//   Caché de Elementos del DOM
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
  // Referencias a los enlaces de navegación
  linkHome: document.getElementById('link-home'),
  linkUsers: document.getElementById('link-users'),
  linkAbout: document.getElementById('link-about')
};

// ==========================================================================
//   GESTOR DE TEMAS (CLARO/OSCURO)
// ==========================================================================

/**
 * Inicializa el tema basándose en LocalStorage o en las preferencias del sistema del usuario.
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    DOM.html.setAttribute('data-theme', savedTheme);
  } else {
    // Verificar preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    DOM.html.setAttribute('data-theme', initialTheme);
    localStorage.setItem('theme', initialTheme);
  }
}

/**
 * Alterna la aplicación entre los temas Claro y Oscuro.
 * Guarda la selección en localStorage.
 */
function toggleTheme() {
  const currentTheme = DOM.html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  DOM.html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}

// ==========================================================================
//   MENÚ MÓVIL (HAMBURGUESA)
// ==========================================================================

/**
 * Alterna el estado activo del menú móvil.
 */
function toggleMobileMenu() {
  const isExpanded = DOM.menuToggle.getAttribute('aria-expanded') === 'true';
  DOM.menuToggle.setAttribute('aria-expanded', !isExpanded);
  DOM.menuToggle.classList.toggle('active');
  DOM.navMenu.classList.toggle('active');
}

/**
 * Cierra el menú de navegación móvil si está abierto actualmente.
 */
function closeMobileMenu() {
  DOM.menuToggle.setAttribute('aria-expanded', 'false');
  DOM.menuToggle.classList.remove('active');
  DOM.navMenu.classList.remove('active');
}

// ==========================================================================
//   ENRUTADOR DE HASH DEL LADO DEL CLIENTE
// ==========================================================================

/**
 * Mapa que muestra la relación entre los hashes de URL y los identificadores de sección de vista en el DOM.
 * @type {Object<string, string>}
 */
const RouteMap = {
  '#/home': 'home-view',
  '#/users': 'users-view',
  '#/about': 'about-view'
};

/**
 * Lógica principal del enrutador que verifica el hash de la URL activa y alterna las vistas dentro del DOM.
 */
function router() {
  let hash = window.location.hash;
  
  // Configuración de la ruta por defecto en caso de fallo
  if (!hash || hash === '#' || hash === '#/') {
    hash = '#/home';
    window.location.hash = '#/home';
    return;
  }

  // Buscar la sección de vista de destino
  const targetSectionId = RouteMap[hash];
  
  if (targetSectionId) {
    // Desactivar todas las secciones, activar la sección de vista correspondiente
    DOM.viewSections.forEach(section => {
      section.classList.remove('active');
    });

    const targetSection = document.getElementById(targetSectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Actualizar los resaltadores de los enlaces de la barra de navegación principal
    DOM.navLinks.forEach(link => {
      if (link.getAttribute('href') === hash) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Cerrar la navegación móvil al completarse la navegación de la ruta
    closeMobileMenu();

    // Activar la carga del directorio desde la API al navegar a la lista de usuarios si está vacía
    if (hash === '#/users' && AppState.users.length === 0) {
      loadTeamDirectory();
    }
  } else {
    // Regresar a la vista de Inicio para URLs no reconocidas
    window.location.hash = '#/home';
  }
}

// ==========================================================================
//   CAPA DE SERVICIOS API
// ==========================================================================

/**
 * Obtiene los datos de usuarios desde la API de Random User.
 * @async
 * @returns {Promise<User[]>} Array de Objetos de Usuario
 * @throws {Error} Error de red o mensaje de fallo de la API
 */
async function fetchUsers() {
  const url = 'https://randomuser.me/api/?results=8&nat=us';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`¡Error de obtención HTTP! Estado: ${response.status}`);
  }
  const data = await response.json();
  return data.results;
}

// ==========================================================================
//   RENDERIZADO DEL DOM Y CONSTRUCTORES DE COMPONENTES
// ==========================================================================

/**
 * Renderiza los esqueletos de usuario dentro del contenedor de la cuadrícula durante los estados de carga.
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
 * Renderiza el componente de estado de error en la cuadrícula del directorio.
 * @param {string} errorMsg Mensaje de error amigable para el usuario
 */
function renderErrorState(errorMsg) {
  DOM.usersGrid.innerHTML = `
    <div class="users-error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--error)" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <h3>No se pudo cargar el directorio del equipo</h3>
      <p>${errorMsg}</p>
      <button id="retry-btn" class="btn btn-primary">Intentar de nuevo</button>
    </div>
  `;

  // Asignar el escuchador de eventos de forma inmediata al botón de reintento creado dinámicamente
  document.getElementById('retry-btn').addEventListener('click', loadTeamDirectory);
}

/**
 * Renderiza el componente de estado vacío cuando las búsquedas filtran a todos los miembros.
 */
function renderEmptyState() {
  DOM.usersGrid.innerHTML = `
    <div class="users-empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <h3>No se encontraron miembros del equipo que coincidan</h3>
      <p>Intente refinar sus términos de búsqueda o cambiar la selección del filtro de género.</p>
    </div>
  `;
}

/**
 * Da formato al código de nacionalidad del país del usuario a una representación en mayúsculas.
 * @param {string} countryCode Código ISO de entrada desde la API
 * @returns {string} Salida con formato
 */
function formatNat(countryCode) {
  return countryCode ? countryCode.toUpperCase() : 'US';
}

/**
 * Construye dinámicamente las estructuras HTML de las tarjetas de usuario.
 * @param {User} user Objeto original del usuario de las respuestas de la API
 * @returns {HTMLElement} Elemento HTML que contiene la tarjeta de información del usuario
 */
function createUserCard(user) {
  const cardElement = document.createElement('div');
  cardElement.className = 'user-card';
  cardElement.setAttribute('tabindex', '0');
  cardElement.setAttribute('role', 'button');
  cardElement.setAttribute('aria-label', `Ver detalles de ${user.name.first} ${user.name.last}`);
  
  const formattedName = `${user.name.first} ${user.name.last}`;
  const genderClass = user.gender === 'male' ? 'male' : 'female';
  const genderLabel = user.gender === 'male' ? 'Masculino' : 'Femenino';
  const genderSymbol = user.gender === 'male' ? '&#9794;' : '&#9792;';

  cardElement.innerHTML = `
    <div class="card-avatar-wrapper">
      <img class="card-avatar" src="${user.picture.large}" alt="Foto de ${formattedName}" loading="lazy">
      <div class="gender-indicator ${genderClass}" title="Género: ${genderLabel}">
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

  // Asignar gancho de presentación del modal de detalles del usuario al interactuar
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
 * Itera sobre la lista de estados de la aplicación, aplica filtros y genera la cuadrícula correspondiente.
 */
function renderUsersGrid() {
  DOM.usersGrid.innerHTML = '';
  
  if (AppState.filteredUsers.length === 0) {
    renderEmptyState();
    return;
  }

  // Contenedor fragmento de envoltura para optimización de velocidad en actualizaciones del DOM
  const fragment = document.createDocumentFragment();
  AppState.filteredUsers.forEach(user => {
    const card = createUserCard(user);
    fragment.appendChild(card);
  });
  DOM.usersGrid.appendChild(fragment);
}

// ==========================================================================
//   MANEJADORES DE CARGA, PROCESADORES DE BÚSQUEDA Y FILTRADO
// ==========================================================================

/**
 * Maneja la carga principal y actualiza las configuraciones del directorio en el estado de la aplicación.
 * @async
 */
async function loadTeamDirectory() {
  try {
    renderSkeletons();
    
    // Deshabilitar selectores de interacción durante el flujo asíncrono
    DOM.refreshUsersBtn.disabled = true;
    
    const results = await fetchUsers();
    
    AppState.users = results;
    applyFilters(); // Procesa el filtrado y dispara la actualización de la interfaz de usuario
  } catch (error) {
    console.error('El intento de obtener el directorio falló:', error);
    renderErrorState(error.message || 'Compruebe su conexión a internet.');
  } finally {
    DOM.refreshUsersBtn.disabled = false;
  }
}

/**
 * Sincroniza la consulta de búsqueda y las entradas de género para generar conjuntos de datos filtrados para su renderizado.
 */
function applyFilters() {
  const query = AppState.currentSearchQuery.toLowerCase().trim();
  const gender = AppState.currentFilterGender;

  AppState.filteredUsers = AppState.users.filter(user => {
    // 1. Filtrar por selección de Género
    const matchesGender = (gender === 'all') || (user.gender === gender);
    
    // 2. Filtrar por coincidencia en la búsqueda
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
//   CONTROLADOR DEL MODAL DE DETALLES
// ==========================================================================

/**
 * Abre la interfaz modal para mostrar la información detallada de un usuario.
 * @param {User} user Configuración del mapa de detalles del usuario seleccionado
 */
function openDetailsModal(user) {
  const formattedName = `${user.name.first} ${user.name.last}`;
  const birthDate = new Date(user.dob.date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  DOM.modalContent.innerHTML = `
    <div class="modal-user-header">
      <img class="modal-avatar" src="${user.picture.large}" alt="Foto de ${formattedName}">
      <h3 class="modal-name">${formattedName}</h3>
      <span class="card-nat-badge">${formatNat(user.nat)}</span>
      <p class="modal-title-desc">Edad de registro: ${user.dob.age} años</p>
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
          <span class="modal-info-label">Correo Electrónico</span>
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
          <span class="modal-info-label">Números de Teléfono</span>
          <span class="modal-info-value">Fijo: ${user.phone} <br> Móvil: ${user.cell}</span>
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
          <span class="modal-info-label">Dirección de Ubicación</span>
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
          <span class="modal-info-label">Fecha de Nacimiento</span>
          <span class="modal-info-value">${birthDate}</span>
        </div>
      </div>
    </div>
  `;

  DOM.userModal.classList.add('active');
  DOM.userModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // Evita el desplazamiento del fondo
  
  // Cambiar el foco al botón de cerrar por cumplimiento de accesibilidad
  DOM.modalClose.focus();
}

/**
 * Cierra la interfaz de la ventana modal de detalles del usuario.
 */
function closeDetailsModal() {
  DOM.userModal.classList.remove('active');
  DOM.userModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = ''; // Restablece los controles de desplazamiento
}

// ==========================================================================
//   CONFIGURACIÓN DE ESCUCHADORES DE EVENTOS Y VÍNCULOS
// ==========================================================================

/**
 * Configura la estructura de enrutamiento, temas, acciones del menú hamburguesa, búsquedas y filtros.
 */
function setupEventListeners() {
  // Manejador del cambio de tema
  DOM.themeToggle.addEventListener('click', toggleTheme);

  // Manejador para alternar el menú de navegación móvil
  DOM.menuToggle.addEventListener('click', toggleMobileMenu);

  // Cierra el menú móvil si se hace clic fuera de la zona del menú de navegación
  document.addEventListener('click', (e) => {
    const clickOnToggle = DOM.menuToggle.contains(e.target);
    const clickOnMenu = DOM.navMenu.contains(e.target);
    if (!clickOnToggle && !clickOnMenu && DOM.navMenu.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // Escuchadores del Enrutador en el cliente
  window.addEventListener('hashchange', router);
  window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    router();
  });

  // Escuchadores del cambio de texto en la búsqueda
  DOM.searchInput.addEventListener('input', (e) => {
    AppState.currentSearchQuery = e.target.value;
    applyFilters();
  });

  // Escuchadores de la selección de filtro por género
  DOM.genderFilter.addEventListener('change', (e) => {
    AppState.currentFilterGender = e.target.value;
    applyFilters();
  });

  // Evento para volver a cargar la información de los miembros del equipo
  DOM.refreshUsersBtn.addEventListener('click', loadTeamDirectory);

  // Eventos de cierre del Modal de Detalles
  DOM.modalClose.addEventListener('click', closeDetailsModal);
  DOM.userModal.addEventListener('click', (e) => {
    if (e.target === DOM.userModal) {
      closeDetailsModal();
    }
  });

  // Cierra el modal de forma dinámica al pulsar la tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.userModal.classList.contains('active')) {
      closeDetailsModal();
    }
  });
}

// Ejecuta la inicialización de los eventos controladores de la aplicación
setupEventListeners();
