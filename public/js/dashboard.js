// Funcionalidad específica para el dashboard de usuario

document.addEventListener('DOMContentLoaded', () => {
    // Verificar autenticación
    if (!AuthSystem.requireAuth()) {
        return;
    }
    
    initDashboard();
    initNavigation();
    loadUserData();
    loadUserReservations();
    loadUserPets();
    loadUserHistory();
    loadLoyaltyData();
    loadPaymentMethods();
});

function initDashboard() {
    // Cargar estadísticas iniciales
    loadDashboardStats();
    
    // Inicializar acciones rápidas
    initQuickActions();
    
    // Cargar actividad reciente
    loadRecentActivity();
}

function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
}

function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.dashboard-section-content');
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

async function loadUserData() {
    try {
        const userData = await api.get('/users/profile');
        updateUserInfo(userData);
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function updateUserInfo(userData) {
    // Actualizar nombre de usuario en el dashboard
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(element => {
        element.textContent = userData.name || 'Usuario';
    });
    
    // Actualizar avatar si existe
    const userAvatar = document.querySelector('.user-avatar img');
    if (userAvatar && userData.avatar) {
        userAvatar.src = userData.avatar;
    }
}

async function loadDashboardStats() {
    try {
        const stats = await api.get('/users/stats');
        updateDashboardStats(stats);
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        NotificationSystem.error('No se pudieron cargar las estadísticas');
        updateDashboardStats({
            upcomingReservations: 0,
            totalPets: 0,
            loyaltyPoints: 0,
            totalSavings: 0
        });
    }
}

function updateDashboardStats(stats) {
    // Actualizar tarjetas de estadísticas
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const statValue = card.querySelector('.stat-value');
        const statDetail = card.querySelector('.stat-detail');
        
        if (card.querySelector('.stat-icon').textContent.includes('📅')) {
            statValue.textContent = stats.upcomingReservations || 0;
            statDetail.textContent = 'Próxima cita';
        } else if (card.querySelector('.stat-icon').textContent.includes('🐾')) {
            statValue.textContent = stats.totalPets || 0;
            statDetail.textContent = 'Mascotas registradas';
        } else if (card.querySelector('.stat-icon').textContent.includes('🏆')) {
            statValue.textContent = stats.loyaltyPoints || 0;
            statDetail.textContent = `A ${500 - (stats.loyaltyPoints % 500)} puntos de premio`;
        } else if (card.querySelector('.stat-icon').textContent.includes('💰')) {
            statValue.textContent = `$${(stats.totalSavings || 0).toFixed(2)}`;
            statDetail.textContent = 'Con descuentos';
        }
    });
}

async function loadUserReservations() {
    try {
        const reservations = await api.get('/users/reservations');
        updateReservationsList(reservations);
    } catch (error) {
        console.error('Error loading reservations:', error);
        NotificationSystem.error('No se pudieron cargar las reservas');
        updateReservationsList([]);
    }
}

function updateReservationsList(reservations) {
    const upcomingReservations = document.getElementById('upcoming-reservations');
    if (!upcomingReservations) return;
    
    const upcoming = reservations.filter(r => r.status === 'confirmed' || r.status === 'pending');
    
    if (upcoming.length === 0) {
        upcomingReservations.innerHTML = '<p>No tienes reservas próximas</p>';
        return;
    }
    
    upcomingReservations.innerHTML = upcoming.map(reservation => `
        <div class="reservation-card">
            <div class="reservation-header">
                <div class="reservation-info">
                    <h3>${reservation.service}</h3>
                    <p class="reservation-date">${DateUtils.formatDate(reservation.date)} - ${DateUtils.formatTime(reservation.time)}</p>
                </div>
                <div class="reservation-status ${reservation.status}">
                    ${getStatusText(reservation.status)}
                </div>
            </div>
            <div class="reservation-details">
                <div class="pet-info">
                    <img src="https://images.unsplash.com/photo-1583337134247-85d2795ece39?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80" alt="${reservation.petName}">
                    <div>
                        <strong>${reservation.petName}</strong>
                        <p>${reservation.petBreed || 'Mascota'} - ${reservation.petAge || ''}</p>
                    </div>
                </div>
                <div class="reservation-price">
                    <strong>$${reservation.price.toFixed(2)}</strong>
                </div>
            </div>
            <div class="reservation-actions">
                <button class="btn btn-secondary" onclick="modifyReservation(${reservation.id})">Modificar</button>
                <button class="btn btn-danger" onclick="cancelReservation(${reservation.id})">Cancelar</button>
            </div>
        </div>
    `).join('');
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

async function loadUserPets() {
    try {
        const pets = await api.get('/users/pets');
        updatePetsGrid(pets);
    } catch (error) {
        console.error('Error loading pets:', error);
        NotificationSystem.error('No se pudieron cargar las mascotas');
        updatePetsGrid([]);
    }
}

function updatePetsGrid(pets) {
    const petsGrid = document.querySelector('.pets-grid');
    if (!petsGrid) return;
    
    if (pets.length === 0) {
        petsGrid.innerHTML = '<p>No tienes mascotas registradas</p>';
        return;
    }
    
    petsGrid.innerHTML = pets.map(pet => `
        <div class="pet-card">
            <div class="pet-image">
                <img src="https://images.unsplash.com/photo-1541364983171-a8ba01e160c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80" alt="${pet.name}">
                ${pet.isPrimary ? '<div class="pet-badge">Principal</div>' : ''}
            </div>
            <div class="pet-info">
                <h3>${pet.name}</h3>
                <p class="pet-breed">${pet.breed}</p>
                <p class="pet-details">${pet.age} • ${pet.weight} kg • ${pet.gender === 'male' ? 'Macho' : 'Hembra'}</p>
                <div class="pet-tags">
                    ${pet.vaccinated ? '<span class="tag">Vacunado</span>' : ''}
                    ${pet.sterilized ? '<span class="tag">Esterilizado</span>' : ''}
                </div>
            </div>
            <div class="pet-actions">
                <button class="btn btn-secondary" onclick="editPet(${pet.id})">Editar</button>
                <button class="btn btn-primary" onclick="bookForPet(${pet.id})">Reservar</button>
            </div>
        </div>
    `).join('');
}

async function loadUserHistory() {
    try {
        const history = await api.get('/users/history');
        updateHistoryList(history);
    } catch (error) {
        console.error('Error loading history:', error);
        // Usar datos de ejemplo
        updateHistoryList([
            {
                id: 1,
                date: '2024-10-15',
                service: 'Baño Completo',
                petName: 'Max',
                price: 25.99,
                rating: 5
            }
        ]);
    }
}

function updateHistoryList(history) {
    const historyList = document.querySelector('.history-list');
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.innerHTML = '<p>No tienes historial de servicios</p>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-date">${DateUtils.formatDate(item.date)}</div>
            <div class="history-service">
                <h4>${item.service}</h4>
                <p>${item.petName} - ${item.petBreed || 'Mascota'}</p>
            </div>
            <div class="history-price">$${item.price.toFixed(2)}</div>
            <div class="history-rating">
                <span class="stars">${'⭐'.repeat(item.rating || 5)}</span>
            </div>
        </div>
    `).join('');
}

async function loadLoyaltyData() {
    try {
        const loyaltyData = await api.get('/users/loyalty');
        updateLoyaltyCard(loyaltyData);
    } catch (error) {
        console.error('Error loading loyalty data:', error);
        NotificationSystem.error('No se pudieron cargar los datos de lealtad');
        updateLoyaltyCard({
            currentPoints: 0,
            nextReward: null,
            rewards: []
        });
    }
}

function updateLoyaltyCard(loyaltyData) {
    const pointsNumber = document.querySelector('.points-number');
    const progressFill = document.querySelector('.progress-fill');
    const rewardsContainer = document.querySelector('.loyalty-rewards');
    
    if (pointsNumber) {
        pointsNumber.textContent = loyaltyData.currentPoints;
    }
    
    if (progressFill && loyaltyData.nextReward) {
        const progress = (loyaltyData.currentPoints % loyaltyData.nextReward.points) / loyaltyData.nextReward.points * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    if (rewardsContainer && loyaltyData.rewards) {
        rewardsContainer.innerHTML = `
            <h3>Próximos Premios</h3>
            ${loyaltyData.rewards.map(reward => `
                <div class="reward-item">
                    <span class="reward-points">${reward.points} puntos</span>
                    <span class="reward-desc">${reward.description}</span>
                </div>
            `).join('')}
        `;
    }
}

async function loadPaymentMethods() {
    try {
        const paymentMethods = await api.get('/users/payment-methods');
        updatePaymentMethods(paymentMethods);
    } catch (error) {
        console.error('Error loading payment methods:', error);
        NotificationSystem.error('No se pudieron cargar los métodos de pago');
        updatePaymentMethods([]);
    }
}

function updatePaymentMethods(paymentMethods) {
    const paymentMethodsContainer = document.querySelector('.payment-methods');
    if (!paymentMethodsContainer) return;
    
    if (paymentMethods.length === 0) {
        paymentMethodsContainer.innerHTML = '<p>No tienes métodos de pago guardados</p>';
        return;
    }
    
    paymentMethodsContainer.innerHTML = `
        <h3>Métodos de Pago Guardados</h3>
        ${paymentMethods.map(method => `
            <div class="payment-card">
                <div class="payment-info">
                    <span class="payment-type">💳</span>
                    <div>
                        <strong>${method.type.toUpperCase()} terminada en ${method.last4}</strong>
                        <p>Expira: ${method.expiryMonth}/${method.expiryYear}</p>
                    </div>
                </div>
                <div class="payment-actions">
                    <button class="btn btn-secondary" onclick="editPaymentMethod(${method.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deletePaymentMethod(${method.id})">Eliminar</button>
                </div>
            </div>
        `).join('')}
    `;
}

async function loadRecentActivity() {
    try {
        const activity = await api.get('/users/activity');
        updateRecentActivity(activity);
    } catch (error) {
        console.error('Error loading recent activity:', error);
        updateRecentActivity([]);
    }
}

function updateRecentActivity(activities) {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p>No tienes actividad reciente</p>';
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
                ${activity.content}
                <span class="activity-date">${activity.date}</span>
            </div>
        </div>
    `).join('');
}

function initQuickActions() {
    // Los botones de acciones rápidas ya tienen sus onclick en el HTML
}

// Funciones de acción
function modifyReservation(reservationId) {
    window.location.href = `booking.html?edit=${reservationId}`;
}

async function cancelReservation(reservationId) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
        return;
    }
    
    try {
        await api.delete(`/reservations/${reservationId}`);
        NotificationSystem.success('Reserva cancelada exitosamente');
        loadUserReservations(); // Recargar la lista
    } catch (error) {
        NotificationSystem.error('Error al cancelar la reserva: ' + error.message);
    }
}

function editPet(petId) {
    // Implementar modal de edición de mascota
    NotificationSystem.info('Función de edición de mascota próximamente');
}

function bookForPet(petId) {
    window.location.href = `booking.html?pet=${petId}`;
}

function editPaymentMethod(methodId) {
    // Implementar modal de edición de método de pago
    NotificationSystem.info('Función de edición de método de pago próximamente');
}

async function deletePaymentMethod(methodId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
        return;
    }
    
    try {
        await api.delete(`/payment-methods/${methodId}`);
        NotificationSystem.success('Método de pago eliminado exitosamente');
        loadPaymentMethods(); // Recargar la lista
    } catch (error) {
        NotificationSystem.error('Error al eliminar el método de pago: ' + error.message);
    }
}

function showAddPetForm() {
    // Implementar modal para agregar mascota
    NotificationSystem.info('Función para agregar mascota próximamente');
}

function showReservationTab(tab) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.reservations-list > div');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.style.display = 'none');
    
    event.target.classList.add('active');
    
    const targetContent = document.getElementById(`${tab}-reservations`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
}

// Función para cerrar sesión
function logout() {
    AuthSystem.logout();
}

// Asignar funciones globales
window.showSection = showSection;
window.modifyReservation = modifyReservation;
window.cancelReservation = cancelReservation;
window.editPet = editPet;
window.bookForPet = bookForPet;
window.editPaymentMethod = editPaymentMethod;
window.deletePaymentMethod = deletePaymentMethod;
window.showAddPetForm = showAddPetForm;
window.showReservationTab = showReservationTab;
window.logout = logout;