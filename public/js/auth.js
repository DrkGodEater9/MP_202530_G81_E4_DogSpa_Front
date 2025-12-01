// Funcionalidad específica para autenticación

document.addEventListener('DOMContentLoaded', () => {
    initAuthForms();
    initPasswordToggles();
});

function initAuthForms() {
    // Formulario de login
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Validaciones
            const errors = [];
            
            if (!FormUtils.validateEmail(email)) {
                errors.push('Por favor ingresa un email válido');
            }
            
            if (password.length < 6) {
                errors.push('La contraseña debe tener al menos 6 caracteres');
            }
            
            if (errors.length > 0) {
                errors.forEach(error => NotificationSystem.error(error));
                return;
            }
            
            try {
                FormUtils.setLoading('loginFormElement', true);
                await AuthSystem.login(email, password);
            } catch (error) {
                console.error('Login error:', error);
            } finally {
                FormUtils.setLoading('loginFormElement', false);
            }
        });
    }
    
    // Formulario de registro
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = FormUtils.serializeForm('registerFormElement');
            
            // Validaciones
            const errors = [];
            
            if (!formData.name || formData.name.length < 2) {
                errors.push('El nombre debe tener al menos 2 caracteres');
            }
            
            if (!formData.lastName || formData.lastName.length < 2) {
                errors.push('El apellido debe tener al menos 2 caracteres');
            }
            
            if (!FormUtils.validateEmail(formData.email)) {
                errors.push('Por favor ingresa un email válido');
            }
            
            if (!FormUtils.validatePhone(formData.phone)) {
                errors.push('Por favor ingresa un teléfono válido');
            }
            
            if (formData.password.length < 6) {
                errors.push('La contraseña debe tener al menos 6 caracteres');
            }
            
            if (formData.password !== formData.confirmPassword) {
                errors.push('Las contraseñas no coinciden');
            }
            
            if (!formData.terms) {
                errors.push('Debes aceptar los términos y condiciones');
            }
            
            if (errors.length > 0) {
                errors.forEach(error => NotificationSystem.error(error));
                return;
            }
            
            try {
                FormUtils.setLoading('registerFormElement', true);
                
                const userData = {
                    name: formData.name,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    role: 'USER'
                };
                
                await AuthSystem.register(userData);
                
                // Limpiar formulario y mostrar login
                FormUtils.clearForm('registerFormElement');
                showLoginForm();
                
            } catch (error) {
                console.error('Register error:', error);
            } finally {
                FormUtils.setLoading('registerFormElement', false);
            }
        });
    }
}

function initPasswordToggles() {
    // Agregar texto original a los botones
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        const input = toggle.previousElementSibling;
        if (input && input.type === 'password') {
            toggle.setAttribute('title', 'Mostrar contraseña');
        }
    });
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }
}

function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && registerForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling;
    
    if (input && toggle) {
        if (input.type === 'password') {
            input.type = 'text';
            toggle.textContent = '🙈';
            toggle.setAttribute('title', 'Ocultar contraseña');
        } else {
            input.type = 'password';
            toggle.textContent = '👁️';
            toggle.setAttribute('title', 'Mostrar contraseña');
        }
    }
}

// Función para recuperar contraseña (placeholder)
function handleForgotPassword() {
    const email = prompt('Ingresa tu email para recuperar tu contraseña:');
    
    if (email && FormUtils.validateEmail(email)) {
        NotificationSystem.info('Se ha enviado un email de recuperación a ' + email);
        // Aquí iría la lógica real de recuperación
    } else if (email) {
        NotificationSystem.error('Por favor ingresa un email válido');
    }
}

// Social login (placeholder)
function handleSocialLogin(provider) {
    NotificationSystem.info(`Inicio de sesión con ${provider} no disponible aún`);
    // Aquí iría la integración con Google, Facebook, etc.
}

// Asignar funciones globales
window.showLoginForm = showLoginForm;
window.showRegisterForm = showRegisterForm;
window.handleForgotPassword = handleForgotPassword;
window.handleSocialLogin = handleSocialLogin;