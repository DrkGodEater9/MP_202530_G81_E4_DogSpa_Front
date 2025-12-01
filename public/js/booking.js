// Funcionalidad específica para reservas

document.addEventListener('DOMContentLoaded', () => {
    initBookingForm();
    initServiceSelection();
    initDateValidation();
});

let currentStep = 1;
const totalSteps = 5;

function initBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (currentStep === totalSteps) {
                await submitBooking();
            }
        });
    }
}

function initServiceSelection() {
    const serviceCheckboxes = document.querySelectorAll('input[name="services"]');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (serviceCheckboxes.length > 0 && totalPriceElement) {
        const servicePrices = {
            'bath': 25.99,
            'haircut': 35.99,
            'spa': 59.99,
            'dental': 19.99,
            'deworming': 15.99
        };
        
        serviceCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateTotalPrice);
        });
        
        function updateTotalPrice() {
            let total = 0;
            serviceCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    total += servicePrices[checkbox.value] || 0;
                }
            });
            totalPriceElement.textContent = total.toFixed(2);
        }
    }
}

function initDateValidation() {
    const bookingDate = document.getElementById('bookingDate');
    if (bookingDate) {
        // Establecer fecha mínima como mañana
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        bookingDate.min = tomorrow.toISOString().split('T')[0];
        
        // Validar que no sea domingo
        bookingDate.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            if (selectedDate.getDay() === 0) { // Domingo
                NotificationSystem.warning('No trabajamos los domingos. Por favor selecciona otro día.');
                this.value = '';
            }
        });
    }
}

function nextStep(step) {
    if (validateCurrentStep()) {
        hideStep(currentStep);
        currentStep = step;
        showStep(currentStep);
        updateProgressBar();
        
        if (currentStep === 5) {
            generateBookingSummary();
        }
    }
}

function previousStep(step) {
    hideStep(currentStep);
    currentStep = step;
    showStep(currentStep);
    updateProgressBar();
}

function showStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
}

function hideStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    if (stepElement) {
        stepElement.classList.remove('active');
    }
}

function updateProgressBar() {
    // Actualizar indicadores de progreso si existen
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
        if (index < currentStep) {
            step.classList.add('completed');
        } else {
            step.classList.remove('completed');
        }
        
        if (index === currentStep - 1) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function validateCurrentStep() {
    let isValid = true;
    const errors = [];
    
    switch (currentStep) {
        case 1:
            // Validar información del cliente
            const customerName = document.getElementById('customerName');
            const customerEmail = document.getElementById('customerEmail');
            const customerPhone = document.getElementById('customerPhone');
            
            if (!customerName.value.trim()) {
                errors.push('El nombre del cliente es requerido');
            }
            
            if (!FormUtils.validateEmail(customerEmail.value)) {
                errors.push('El email no es válido');
            }
            
            if (!FormUtils.validatePhone(customerPhone.value)) {
                errors.push('El teléfono no es válido');
            }
            break;
            
        case 2:
            // Validar información de la mascota
            const petName = document.getElementById('petName');
            const petType = document.getElementById('petType');
            const petBreed = document.getElementById('petBreed');
            const petAge = document.getElementById('petAge');
            const petWeight = document.getElementById('petWeight');
            const petGender = document.getElementById('petGender');
            
            if (!petName.value.trim()) {
                errors.push('El nombre de la mascota es requerido');
            }
            
            if (!petType.value) {
                errors.push('Selecciona el tipo de mascota');
            }
            
            if (!petBreed.value.trim()) {
                errors.push('La raza es requerida');
            }
            
            if (!petAge.value.trim()) {
                errors.push('La edad es requerida');
            }
            
            if (!petWeight.value || petWeight.value <= 0) {
                errors.push('El peso debe ser mayor a 0');
            }
            
            if (!petGender.value) {
                errors.push('Selecciona el género de la mascota');
            }
            break;
            
        case 3:
            // Validar selección de servicios
            const selectedServices = document.querySelectorAll('input[name="services"]:checked');
            if (selectedServices.length === 0) {
                errors.push('Selecciona al menos un servicio');
            }
            break;
            
        case 4:
            // Validar fecha y hora
            const bookingDate = document.getElementById('bookingDate');
            const bookingTime = document.getElementById('bookingTime');
            
            if (!bookingDate.value) {
                errors.push('Selecciona una fecha para la reserva');
            }
            
            if (!bookingTime.value) {
                errors.push('Selecciona una hora para la reserva');
            }
            
            // Validar que la fecha no sea en el pasado
            if (bookingDate.value && DateUtils.isDateInPast(bookingDate.value)) {
                errors.push('La fecha no puede ser en el pasado');
            }
            break;
    }
    
    if (errors.length > 0) {
        errors.forEach(error => NotificationSystem.error(error));
        isValid = false;
    }
    
    return isValid;
}

function generateBookingSummary() {
    const summaryContent = document.getElementById('summaryContent');
    if (!summaryContent) return;
    
    // Obtener datos del formulario
    const customerName = document.getElementById('customerName').value;
    const customerEmail = document.getElementById('customerEmail').value;
    const customerPhone = document.getElementById('customerPhone').value;
    
    const petName = document.getElementById('petName').value;
    const petType = document.getElementById('petType').value;
    const petBreed = document.getElementById('petBreed').value;
    const petAge = document.getElementById('petAge').value;
    const petWeight = document.getElementById('petWeight').value;
    const petGender = document.getElementById('petGender').value;
    
    const selectedServices = Array.from(document.querySelectorAll('input[name="services"]:checked'));
    const bookingDate = document.getElementById('bookingDate').value;
    const bookingTime = document.getElementById('bookingTime').value;
    const bookingNotes = document.getElementById('bookingNotes').value;
    
    // Generar HTML del resumen
    const servicesText = selectedServices.map(service => {
        const label = service.nextElementSibling.querySelector('h4').textContent;
        const price = service.nextElementSibling.querySelector('.service-price').textContent;
        return `${label} - ${price}`;
    }).join('<br>');
    
    const totalPrice = document.getElementById('totalPrice').textContent;
    
    summaryContent.innerHTML = `
        <div class="summary-section">
            <h4>Información del Cliente</h4>
            <p><strong>Nombre:</strong> ${customerName}</p>
            <p><strong>Email:</strong> ${customerEmail}</p>
            <p><strong>Teléfono:</strong> ${customerPhone}</p>
        </div>
        
        <div class="summary-section">
            <h4>Información de la Mascota</h4>
            <p><strong>Nombre:</strong> ${petName}</p>
            <p><strong>Tipo:</strong> ${petType === 'dog' ? 'Perro' : 'Gato'}</p>
            <p><strong>Raza:</strong> ${petBreed}</p>
            <p><strong>Edad:</strong> ${petAge}</p>
            <p><strong>Peso:</strong> ${petWeight} kg</p>
            <p><strong>Género:</strong> ${petGender === 'male' ? 'Macho' : 'Hembra'}</p>
        </div>
        
        <div class="summary-section">
            <h4>Servicios Seleccionados</h4>
            <p>${servicesText}</p>
        </div>
        
        <div class="summary-section">
            <h4>Fecha y Hora</h4>
            <p><strong>Fecha:</strong> ${DateUtils.formatDate(bookingDate)}</p>
            <p><strong>Hora:</strong> ${DateUtils.formatTime(bookingTime)}</p>
        </div>
        
        ${bookingNotes ? `
        <div class="summary-section">
            <h4>Notas Adicionales</h4>
            <p>${bookingNotes}</p>
        </div>
        ` : ''}
        
        <div class="summary-section total">
            <h4>Total a Pagar</h4>
            <p class="total-price">$${totalPrice}</p>
        </div>
    `;
}

async function submitBooking() {
    try {
        FormUtils.setLoading('bookingForm', true);
        
        // Recopilar datos del formulario
        const bookingData = {
            customer: {
                name: document.getElementById('customerName').value,
                email: document.getElementById('customerEmail').value,
                phone: document.getElementById('customerPhone').value
            },
            pet: {
                name: document.getElementById('petName').value,
                type: document.getElementById('petType').value,
                breed: document.getElementById('petBreed').value,
                age: document.getElementById('petAge').value,
                weight: parseFloat(document.getElementById('petWeight').value),
                gender: document.getElementById('petGender').value,
                notes: document.getElementById('petNotes').value
            },
            services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value),
            bookingDate: document.getElementById('bookingDate').value,
            bookingTime: document.getElementById('bookingTime').value,
            notes: document.getElementById('bookingNotes').value,
            totalPrice: parseFloat(document.getElementById('totalPrice').textContent),
            status: 'pending'
        };
        
        // Enviar al backend
        const response = await api.post('/reservations', bookingData);
        
        NotificationSystem.success('¡Reserva creada exitosamente! Te contactaremos pronto para confirmar.');
        
        // Redirigir al dashboard o página de confirmación
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Booking error:', error);
        NotificationSystem.error('Error al crear la reserva: ' + error.message);
    } finally {
        FormUtils.setLoading('bookingForm', false);
    }
}

function bookService(serviceType) {
    // Redirigir a la página de reservas con el servicio preseleccionado
    window.location.href = `booking.html?service=${serviceType}`;
}

// Función para reserva rápida desde la página principal
document.addEventListener('DOMContentLoaded', () => {
    const quickBookingForm = document.getElementById('quickBookingForm');
    if (quickBookingForm) {
        quickBookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const petName = document.getElementById('petName').value;
            const serviceType = document.getElementById('serviceType').value;
            const bookingDate = document.getElementById('bookingDate').value;
            
            if (!petName || !serviceType || !bookingDate) {
                NotificationSystem.error('Por favor completa todos los campos');
                return;
            }
            
            // Redirigir al formulario completo con datos precargados
            const params = new URLSearchParams({
                petName,
                service: serviceType,
                date: bookingDate
            });
            
            window.location.href = `booking.html?${params.toString()}`;
        });
    }
});

// Asignar funciones globales
window.nextStep = nextStep;
window.previousStep = previousStep;
window.bookService = bookService;