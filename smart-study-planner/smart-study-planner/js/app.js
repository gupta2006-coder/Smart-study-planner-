// DOM Elements
const sidebarToggle = document.body.querySelector('#sidebarToggle');
const sidebarWrapper = document.body.querySelector('#sidebar-wrapper');
const pageContentWrapper = document.body.querySelector('#page-content-wrapper');

// Toggle Sidebar
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', event => {
        event.preventDefault();
        document.body.classList.toggle('sb-sidenav-toggled');
    });
}

// Navigation
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(el => el.classList.add('d-none'));
    // Show selected section
    document.getElementById(`${sectionId}-section`).classList.remove('d-none');
    
    // Update active state in sidebar
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// Mock Data
let tasks = [
    { id: 1, title: 'Complete Calculus Chapter 5', subject: 'Mathematics', date: '2023-11-30', priority: 'High', status: 'Pending' },
    { id: 2, title: 'Physics Lab Report', subject: 'Physics', date: '2023-12-01', priority: 'Medium', status: 'Completed' },
    { id: 3, title: 'History Essay Draft', subject: 'History', date: '2023-12-05', priority: 'Low', status: 'Pending' },
    { id: 4, title: 'Algorithm Analysis', subject: 'Computer Science', date: '2023-11-29', priority: 'High', status: 'Pending' }
];

const subjects = [
    { name: 'Mathematics', color: 'primary', icon: 'fa-calculator' },
    { name: 'Physics', color: 'success', icon: 'fa-atom' },
    { name: 'History', color: 'warning', icon: 'fa-landmark' },
    { name: 'Computer Science', color: 'info', icon: 'fa-laptop-code' }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth(); // Check if user is logged in
    
    // Only run these if we are on the main dashboard page
    if(document.getElementById('tasks-table-body')) {
        loadUserData();
        renderTasks();
        renderTodaysFocus();
        renderSubjects();
        initChart();
    }
});

// --- Authentication & User Management ---

function checkAuth() {
    const user = localStorage.getItem('studyUser');
    const path = window.location.pathname;
    const isAuthPage = path.includes('login.html') || path.includes('register.html');

    if (!user && !isAuthPage) {
        window.location.href = 'login.html';
    } else if (user && isAuthPage) {
        window.location.href = 'index.html';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alertBox = document.getElementById('login-alert');

    // Simple validation
    if (!email || !password) {
        showAlert(alertBox, 'Please fill in all fields', 'danger');
        return;
    }

    // Mock Login Logic
    // In a real app, this would call a backend API
    const storedUsers = JSON.parse(localStorage.getItem('studyUsers') || '[]');
    const user = storedUsers.find(u => u.email === email && u.password === password);

    if (user) {
        localStorage.setItem('studyUser', JSON.stringify(user));
        showAlert(alertBox, 'Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showAlert(alertBox, 'Invalid email or password', 'danger');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const alertBox = document.getElementById('register-alert');

    // Validation
    if (password.length < 6) {
        showAlert(alertBox, 'Password must be at least 6 characters long', 'danger');
        return;
    }

    if (password !== confirmPassword) {
        showAlert(alertBox, 'Passwords do not match', 'danger');
        return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('studyUsers') || '[]');
    
    if (storedUsers.find(u => u.email === email)) {
        showAlert(alertBox, 'Email already registered', 'danger');
        return;
    }

    // Create User
    const newUser = {
        name: name,
        email: email,
        password: password, // In real app, never store plain text passwords!
        bio: '',
        school: ''
    };

    storedUsers.push(newUser);
    localStorage.setItem('studyUsers', JSON.stringify(storedUsers));
    
    showAlert(alertBox, 'Registration successful! Please login.', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

function logout() {
    localStorage.removeItem('studyUser');
    window.location.href = 'login.html';
}

function loadUserData() {
    const user = JSON.parse(localStorage.getItem('studyUser'));
    if (user) {
        // Update Navbar
        document.getElementById('navUserName').textContent = user.name;
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4361ee&color=fff`;
        document.getElementById('navUserAvatar').src = avatarUrl;

        // Update Profile Section
        document.getElementById('profileNameDisplay').textContent = user.name;
        document.getElementById('profileEmailDisplay').textContent = user.email;
        document.getElementById('profileAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4361ee&color=fff&size=128`;
        
        // Fill Form
        document.getElementById('profileName').value = user.name;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileBio').value = user.bio || '';
        document.getElementById('profileSchool').value = user.school || '';
    }
}

function updateProfile(event) {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem('studyUser'));
    const newName = document.getElementById('profileName').value;
    const newBio = document.getElementById('profileBio').value;
    const newSchool = document.getElementById('profileSchool').value;

    if (user) {
        user.name = newName;
        user.bio = newBio;
        user.school = newSchool;

        // Update current session
        localStorage.setItem('studyUser', JSON.stringify(user));

        // Update database (mock)
        const storedUsers = JSON.parse(localStorage.getItem('studyUsers') || '[]');
        const index = storedUsers.findIndex(u => u.email === user.email);
        if (index !== -1) {
            storedUsers[index] = user;
            localStorage.setItem('studyUsers', JSON.stringify(storedUsers));
        }

        showPageAlert('Profile updated successfully!', 'success');
        loadUserData(); // Refresh UI
    }
}

function changePassword(event) {
    event.preventDefault();
    // Mock password change
    showPageAlert('Password updated successfully!', 'success');
    document.querySelector('#settings-section form').reset();
}

// --- Helper Functions ---

function showAlert(element, message, type) {
    element.className = `alert alert-${type} d-block`;
    element.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>${message}`;
}

function showPageAlert(message, type) {
    const container = document.getElementById('main-alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(alertDiv);
    
    // Auto dismiss
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// --- Existing App Logic ---

// Render Tasks Table
function renderTasks() {
    const tbody = document.getElementById('tasks-table-body');
    tbody.innerHTML = '';

    tasks.forEach(task => {
        const row = document.createElement('tr');
        const badgeClass = task.priority === 'High' ? 'bg-danger' : (task.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-success');
        const statusIcon = task.status === 'Completed' ? '<i class="fas fa-check-circle text-success"></i>' : '<i class="far fa-circle text-muted"></i>';
        
        row.innerHTML = `
            <td><span class="cursor-pointer" onclick="toggleTaskStatus(${task.id})">${statusIcon}</span></td>
            <td class="${task.status === 'Completed' ? 'text-decoration-line-through text-muted' : ''}">${task.title}</td>
            <td><span class="badge bg-light text-dark border">${task.subject}</span></td>
            <td>${task.date}</td>
            <td><span class="badge ${badgeClass}">${task.priority}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Render Today's Focus (Dashboard)
function renderTodaysFocus() {
    const list = document.getElementById('todays-focus-list');
    list.innerHTML = '';
    
    const pendingTasks = tasks.filter(t => t.status === 'Pending').slice(0, 5);
    
    pendingTasks.forEach(task => {
        const item = document.createElement('li');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.innerHTML = `
            <div>
                <input class="form-check-input me-2" type="checkbox" onclick="toggleTaskStatus(${task.id})">
                ${task.title}
            </div>
            <span class="badge bg-light text-dark">${task.subject}</span>
        `;
        list.appendChild(item);
    });
}

// Render Subjects Grid
function renderSubjects() {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = '';

    subjects.forEach(sub => {
        const col = document.createElement('div');
        col.className = 'col-md-6 col-lg-3';
        col.innerHTML = `
            <div class="card h-100 border-0 shadow-sm">
                <div class="card-body text-center">
                    <div class="avatar bg-${sub.color} bg-opacity-10 text-${sub.color} rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 60px; height: 60px;">
                        <i class="fas ${sub.icon} fa-2x"></i>
                    </div>
                    <h5 class="card-title">${sub.name}</h5>
                    <p class="text-muted small mb-0">3 Tasks Pending</p>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

// Add New Task
function addTask() {
    const title = document.getElementById('taskTitle').value;
    const subject = document.getElementById('taskSubject').value;
    const date = document.getElementById('taskDate').value;
    const priority = document.getElementById('taskPriority').value;

    if (title && date) {
        const newTask = {
            id: tasks.length + 1,
            title: title,
            subject: subject,
            date: date,
            priority: priority,
            status: 'Pending'
        };
        
        tasks.push(newTask);
        renderTasks();
        renderTodaysFocus();
        
        // Close modal
        const modalEl = document.getElementById('addTaskModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
        
        // Reset form
        document.getElementById('addTaskForm').reset();
    } else {
        alert('Please fill in all required fields');
    }
}

// Toggle Task Status
function toggleTaskStatus(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = task.status === 'Pending' ? 'Completed' : 'Pending';
        renderTasks();
        renderTodaysFocus();
    }
}

// Delete Task
function deleteTask(id) {
    if(confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
        renderTodaysFocus();
    }
}

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('studyChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Hours Studied',
                data: [4, 5.5, 3, 6, 4.5, 7, 2],
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        borderDash: [2, 4]
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}