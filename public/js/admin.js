// Funcionalidad específica para el panel de administrador

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación y rol de administrador
    if (!AuthSystem.requireAdmin()) {
        return;
    }
    
    initAdminDashboard();
    initAdminNavigation();
    loadAdminStats();
    loadRecentActivity();
    loadReservations();
    loadServices();
    loadCustomers();
    loadPets();
    loadEmployees();
    initScheduleSettings();
    initReports();
});

function initAdminDashboard() {
    // Inicializar acciones rápidas del admin
    initAdminQuickActions();
}

function initAdminNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('href').substring(1);
            showAdminSection(sectionId);
        });
    });
}

function showAdminSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.admin-section-content');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar navegación
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${sectionId}`) {
            item.classList.add('active');
        }
    });
}

async function loadAdminStats() {
    try {
        const stats = await api.get('/admin/stats');
        updateAdminStats(stats);
    } catch (error) {
        console.error('Error loading admin stats:', error);
        NotificationSystem.error('No se pudieron cargar las estadísticas');
        updateAdminStats({
            todayReservations: 0,
            monthlyRevenue: 0,
            newCustomers: 0,
            totalPets: 0
        });
    }
}

function updateAdminStats(stats) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const statNumber = card.querySelector('.stat-number');
        const statChange = card.querySelector('.stat-change');
        
        if (card.querySelector('.stat-icon').textContent.includes('📅')) {
            statNumber.textContent = stats.todayReservations || 0;
            statChange.textContent = '+20% vs ayer';
            statChange.className = 'stat-change positive';
        } else if (card.querySelector('.stat-icon').textContent.includes('💰')) {
            statNumber.textContent = `$${(stats.monthlyRevenue || 0).toLocaleString()}`;
            statChange.textContent = '+15% vs mes pasado';
            statChange.className = 'stat-change positive';
        } else if (card.querySelector('.stat-icon').textContent.includes('👥')) {
            statNumber.textContent = stats.newCustomers || 0;
            statChange.textContent = '+8% vs mes pasado';
            statChange.className = 'stat-change positive';
        } else if (card.querySelector('.stat-icon').textContent.includes('🐾')) {
            statNumber.textContent = stats.totalPets || 0;
            statChange.textContent = '+12% vs mes pasado';
            statChange.className = 'stat-change positive';
        }
    });
}

async function loadRecentActivity() {
    try {
        const activity = await api.get('/admin/activity');
        updateRecentActivity(activity);
    } catch (error) {
        console.error('Error loading recent activity:', error);
        NotificationSystem.error('No se pudo cargar la actividad reciente');
        updateRecentActivity([]);
    }
}

function updateRecentActivity(activities) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-time">${activity.time}</div>
            <div class="activity-content">
                ${activity.content}
            </div>
        </div>
    `).join('');
}

async function loadReservations() {
    try {
        const reservations = await api.get('/admin/reservations');
        updateReservationsTable(reservations);
    } catch (error) {
        console.error('Error loading reservations:', error);
        NotificationSystem.error('No se pudieron cargar las reservas');
        updateReservationsTable([]);
    }
}

function updateReservationsTable(reservations) {
    const tableBody = document.getElementById('reservationsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = reservations.map(reservation => `
        <tr>
            <td>#${String(reservation.id).padStart(3, '0')}</td>
            <td>${reservation.customerName}</td>
            <td>${reservation.petName}</td>
            <td>${reservation.service}</td>
            <td>${formatDate(reservation.date)}</td>
            <td>${formatTime(reservation.time)}</td>
            <td><span class="status-badge ${reservation.status}">${getStatusText(reservation.status)}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editReservation(${reservation.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteReservation(${reservation.id})">Cancelar</button>
            </td>
        </tr>
    `).join('');
}

async function loadServices() {
    try {
        const services = await api.get('/admin/services');
        updateServicesGrid(services);
    } catch (error) {
        console.error('Error loading services:', error);
        NotificationSystem.error('No se pudieron cargar los servicios');
        updateServicesGrid([]);
    }
}

function updateServicesGrid(services) {
    const servicesGrid = document.querySelector('.services-grid');
    if (!servicesGrid) return;
    
    servicesGrid.innerHTML = services.map(service => `
        <div class="service-card-admin">
            <div class="service-info">
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="service-details">
                    <span class="price">$${service.price.toFixed(2)}</span>
                    <span class="duration">${service.duration} min</span>
                </div>
            </div>
            <div class="service-actions">
                <button class="btn btn-sm btn-secondary" onclick="editService(${service.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deleteService(${service.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

async function loadCustomers() {
    try {
        const customers = await api.get('/admin/customers');
        updateCustomersTable(customers);
    } catch (error) {
        console.error('Error loading customers:', error);
        NotificationSystem.error('No se pudieron cargar los clientes');
        updateCustomersTable([]);
    }
}

function updateCustomersTable(customers) {
    const tableBody = document.querySelector('.customers-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = customers.map(customer => `
        <tr>
            <td>#${String(customer.id).padStart(3, '0')}</td>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.petsCount || 0}</td>
            <td>${customer.reservationsCount || 0}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewCustomerDetails(${customer.id})">Ver Detalles</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function loadPets() {
    try {
        const pets = await api.get('/admin/pets');
        updatePetsTable(pets);
    } catch (error) {
        console.error('Error loading pets:', error);
        NotificationSystem.error('No se pudieron cargar las mascotas');
        updatePetsTable([]);
    }
}

function updatePetsTable(pets) {
    const tableBody = document.querySelector('.pets-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = pets.map(pet => `
        <tr>
            <td>#${String(pet.id).padStart(3, '0')}</td>
            <td>${pet.name}</td>
            <td>${pet.breed}</td>
            <td>${pet.ownerName}</td>
            <td>${pet.age}</td>
            <td>${pet.weight} kg</td>
            <td>${pet.notes || '-'}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editPet(${pet.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="deletePet(${pet.id})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function loadEmployees() {
    try {
        const employees = await api.get('/admin/employees');
        updateEmployeesTable(employees);
    } catch (error) {
        console.error('Error loading employees:', error);
        NotificationSystem.error('No se pudieron cargar los empleados');
        updateEmployeesTable([]);
    }
}

function updateEmployeesTable(employees) {
    const tableBody = document.querySelector('.employees-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = employees.map(employee => `
        <tr>
            <td>#${String(employee.id).padStart(3, '0')}</td>
            <td>${employee.name}</td>
            <td>${employee.email}</td>
            <td>${employee.role}</td>
            <td>${employee.specialty || '-'}</td>
            <td><span class="status-badge ${employee.status}">${employee.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editEmployee(${employee.id})">Editar</button>
                <button class="btn btn-sm btn-danger" onclick="${employee.status === 'active' ? 'deactivateEmployee' : 'activateEmployee'}(${employee.id})">${employee.status === 'active' ? 'Desactivar' : 'Activar'}</button>
            </td>
        </tr>
    `).join('');
}

function initScheduleSettings() {
    const scheduleForm = document.querySelector('.schedule-form');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(scheduleForm);
            const scheduleData = {
                dayOfWeek: formData.get('dayOfWeek'),
                openingTime: formData.get('openingTime'),
                closingTime: formData.get('closingTime')
            };
            
            try {
                await api.post('/admin/schedule', scheduleData);
                NotificationSystem.success('Horario guardado exitosamente');
            } catch (error) {
                NotificationSystem.error('Error al guardar horario: ' + error.message);
            }
        });
    }
}

function initReports() {
    const reportButtons = document.querySelectorAll('.report-card button');
    reportButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const reportType = button.closest('.report-card').querySelector('h3').textContent;
            generateReport(reportType);
        });
    });
}

async function generateReport(reportType) {
    try {
        const reportData = await api.get(`/admin/reports/${reportType.toLowerCase().replace(' ', '-')}`);
        
        // Crear y descargar el reporte
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType.toLowerCase().replace(' ', '-')}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        NotificationSystem.success(`Reporte de ${reportType} generado exitosamente`);
    } catch (error) {
        NotificationSystem.error('Error al generar reporte: ' + error.message);
    }
}

function initAdminQuickActions() {
    // Los botones de acciones rápidas ya tienen sus onclick en el HTML
}

// Funciones de acción
function showAddReservationModal() {
    // Implementar modal para agregar reserva
    NotificationSystem.info('Función para agregar reserva próximamente');
}

function showAddServiceModal() {
    // Implementar modal para agregar servicio
    NotificationSystem.info('Función para agregar servicio próximamente');
}

function showAddCustomerModal() {
    // Implementar modal para agregar cliente
    NotificationSystem.info('Función para agregar cliente próximamente');
}

function showAddPetModal() {
    // Implementar modal para agregar mascota
    NotificationSystem.info('Función para agregar mascota próximamente');
}

function showAddEmployeeModal() {
    // Implementar modal para agregar empleado
    NotificationSystem.info('Función para agregar empleado próximamente');
}

async function editReservation(reservationId) {
    // Implementar modal de edición
    NotificationSystem.info('Función de edición de reserva próximamente');
}

async function deleteReservation(reservationId) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
        return;
    }
    
    try {
        await api.delete(`/admin/reservations/${reservationId}`);
        NotificationSystem.success('Reserva cancelada exitosamente');
        loadReservations();
    } catch (error) {
        NotificationSystem.error('Error al cancelar reserva: ' + error.message);
    }
}

async function editService(serviceId) {
    NotificationSystem.info('Función de edición de servicio próximamente');
}

async function deleteService(serviceId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
        return;
    }
    
    try {
        await api.delete(`/admin/services/${serviceId}`);
        NotificationSystem.success('Servicio eliminado exitosamente');
        loadServices();
    } catch (error) {
        NotificationSystem.error('Error al eliminar servicio: ' + error.message);
    }
}

function viewCustomerDetails(customerId) {
    // Implementar vista detallada del cliente
    NotificationSystem.info('Función de detalles de cliente próximamente');
}

async function deleteCustomer(customerId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
        return;
    }
    
    try {
        await api.delete(`/admin/customers/${customerId}`);
        NotificationSystem.success('Cliente eliminado exitosamente');
        loadCustomers();
    } catch (error) {
        NotificationSystem.error('Error al eliminar cliente: ' + error.message);
    }
}

async function editPet(petId) {
    NotificationSystem.info('Función de edición de mascota próximamente');
}

async function deletePet(petId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mascota?')) {
        return;
    }
    
    try {
        await api.delete(`/admin/pets/${petId}`);
        NotificationSystem.success('Mascota eliminada exitosamente');
        loadPets();
    } catch (error) {
        NotificationSystem.error('Error al eliminar mascota: ' + error.message);
    }
}

async function editEmployee(employeeId) {
    NotificationSystem.info('Función de edición de empleado próximamente');
}

async function deactivateEmployee(employeeId) {
    if (!confirm('¿Estás seguro de que quieres desactivar este empleado?')) {
        return;
    }
    
    try {
        await api.put(`/admin/employees/${employeeId}/deactivate`);
        NotificationSystem.success('Empleado desactivado exitosamente');
        loadEmployees();
    } catch (error) {
        NotificationSystem.error('Error al desactivar empleado: ' + error.message);
    }
}

async function activateEmployee(employeeId) {
    try {
        await api.put(`/admin/employees/${employeeId}/activate`);
        NotificationSystem.success('Empleado activado exitosamente');
        loadEmployees();
    } catch (error) {
        NotificationSystem.error('Error al activar empleado: ' + error.message);
    }
}

// Funciones de utilidad
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'confirmed': 'Confirmada',
        'cancelled': 'Cancelada',
        'completed': 'Completada'
    };
    return statusMap[status] || status;
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function logout() {
    AuthSystem.logout();
}

// Asignar funciones globales
window.showAdminSection = showAdminSection;
window.showAddReservationModal = showAddReservationModal;
window.showAddServiceModal = showAddServiceModal;
window.showAddCustomerModal = showAddCustomerModal;
window.showAddPetModal = showAddPetModal;
window.showAddEmployeeModal = showAddEmployeeModal;
window.editReservation = editReservation;
window.deleteReservation = deleteReservation;
window.editService = editService;
window.deleteService = deleteService;
window.viewCustomerDetails = viewCustomerDetails;
window.deleteCustomer = deleteCustomer;
window.editPet = editPet;
window.deletePet = deletePet;
window.editEmployee = editEmployee;
window.deactivateEmployee = deactivateEmployee;
window.activateEmployee = activateEmployee;
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;