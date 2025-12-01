// Funciones globales y utilidades

// Configuración de la API
const API_CONFIG = {
    baseURL: 'http://localhost:8080/api', // URL del backend Spring Boot
    timeout: 10000
};

// Estado global de la aplicación
const AppState = {
    user: null,
    token: localStorage.getItem('token'),
    isAdmin: localStorage.getItem('isAdmin') === 'true'
};

// Utilidades de API
class ApiClient {
    constructor(baseURL = API_CONFIG.baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Agregar token si existe
        if (AppState.token) {
            config.headers.Authorization = `Bearer ${AppState.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint);
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }
}

const api = new ApiClient();

// Sistema de notificaciones
class NotificationSystem {
    static show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                }
                .notification.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                .notification.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                .notification.warning {
                    background: #fff3cd;
                    color: #856404;
                    border: 1px solid #ffeaa7;
                }
                .notification.info {
                    background: #d1ecf1;
                    color: #0c5460;
                    border: 1px solid #bee5eb;
                }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    opacity: 0.7;
                }
                .notification-close:hover {
                    opacity: 1;
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-eliminar después de la duración
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    static success(message, duration) {
        this.show(message, 'success', duration);
    }

    static error(message, duration) {
        this.show(message, 'error', duration);
    }

    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    static info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Sistema de autenticación
class AuthSystem {
    static async login(email, password) {
        try {
            const response = await api.post('/auth/login', { email, password });
            
            if (response.token) {
                AppState.token = response.token;
                AppState.user = response.user;
                AppState.isAdmin = response.user.role === 'ADMIN';
                
                localStorage.setItem('token', response.token);
                localStorage.setItem('isAdmin', AppState.isAdmin);
                
                NotificationSystem.success('¡Inicio de sesión exitoso!');
                
                // Redirigir según el rol
                if (AppState.isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }
            
            return response;
        } catch (error) {
            NotificationSystem.error('Error al iniciar sesión: ' + error.message);
            throw error;
        }
    }

    static async register(userData) {
        try {
            const response = await api.post('/auth/register', userData);
            NotificationSystem.success('¡Cuenta creada exitosamente!');
            return response;
        } catch (error) {
            NotificationSystem.error('Error al crear cuenta: ' + error.message);
            throw error;
        }
    }

    static logout() {
        AppState.token = null;
        AppState.user = null;
        AppState.isAdmin = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        
        NotificationSystem.info('Sesión cerrada');
        window.location.href = 'index.html';
    }

    static isAuthenticated() {
        return !!AppState.token;
    }

    static requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    static requireAdmin() {
        if (!this.isAuthenticated() || !AppState.isAdmin) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }
}

// Utilidades de formulario
class FormUtils {
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]+$/;
        return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    static validateRequired(fields) {
        const errors = [];
        
        fields.forEach(field => {
            const element = document.getElementById(field);
            if (!element || !element.value.trim()) {
                errors.push(`El campo ${field} es requerido`);
            }
        });
        
        return errors;
    }

    static serializeForm(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    static clearForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    static setLoading(buttonId, loading = true) {
        const button = document.getElementById(buttonId);
        if (button) {
            if (loading) {
                button.disabled = true;
                button.innerHTML = '<span class="loading"></span> Procesando...';
            } else {
                button.disabled = false;
                button.innerHTML = button.getAttribute('data-original-text') || 'Enviar';
            }
        }
    }
}

// Utilidades de fecha
class DateUtils {
    static formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(date).toLocaleDateString('es-ES', options);
    }

    static formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    static isDateInPast(date) {
        return new Date(date) < new Date();
    }

    static addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    static getMinDate() {
        return new Date().toISOString().split('T')[0];
    }
}

// Utilidades de UI
class UIUtils {
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    static toggleElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = element.style.display === 'none' ? 'block' : 'none';
        }
    }

    static setActiveTab(tabButtons, tabContents, activeIndex) {
        // Desactivar todos los tabs
        tabButtons.forEach((btn, index) => {
            btn.classList.toggle('active', index === activeIndex);
        });
        
        tabContents.forEach((content, index) => {
            content.classList.toggle('active', index === activeIndex);
        });
    }

    static animateNumber(elementId, targetNumber, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const startNumber = 0;
        const increment = targetNumber / (duration / 16);
        let currentNumber = startNumber;
        
        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= targetNumber) {
                currentNumber = targetNumber;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentNumber);
        }, 16);
    }
}

// Manejo del menú móvil
function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Manejo del dropdown de usuario
function initUserDropdown() {
    const userAvatar = document.querySelector('.user-avatar');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userAvatar && userDropdown) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }
}

// Toggle de contraseña
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initUserDropdown();
    
    // Animar números en las estadísticas
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(element => {
        const targetNumber = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        if (!isNaN(targetNumber)) {
            UIUtils.animateNumber(element.id, targetNumber);
        }
    });
    
    // Establecer fecha mínima para inputs de fecha
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const minDate = DateUtils.getMinDate();
    dateInputs.forEach(input => {
        input.min = minDate;
    });
});

// Exportar utilidades para uso global
window.ApiClient = ApiClient;
window.NotificationSystem = NotificationSystem;
window.AuthSystem = AuthSystem;
window.FormUtils = FormUtils;
window.DateUtils = DateUtils;
window.UIUtils = UIUtils;
window.togglePassword = togglePassword;