// DOM Elements
const loginSection = document.getElementById('login-section');
const mainApp = document.getElementById('main-app');
const usernameInput = document.getElementById('username-input');
const profilePhotoInput = document.getElementById('profile-photo-input');
const loginBtn = document.getElementById('login-btn');
const welcomeMessage = document.getElementById('welcome-message');
const profilePhoto = document.getElementById('profile-photo');
const currentDate = document.getElementById('current-date');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const categoriesContainer = document.querySelector('.categories-container');
const currentCategory = document.getElementById('current-category');
const inputBox = document.getElementById('input-box');
const addBtn = document.getElementById('add-btn');
const listContainer = document.getElementById('list-container');
const scheduleTime = document.getElementById('schedule-time');
const scheduleAllBtn = document.getElementById('schedule-all-btn');
const selectedTimeDisplay = document.getElementById('selected-time');
const categoryModal = document.getElementById('category-modal');
const newCategoryName = document.getElementById('new-category-name');
const saveCategoryBtn = document.getElementById('save-category-btn');
const closeModal = document.querySelector('.close');
const editModal = document.getElementById('edit-modal');
const editTaskText = document.getElementById('edit-task-text');
const editTaskTime = document.getElementById('edit-task-time');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const closeEditModal = document.querySelector('.close-edit');
const logoutBtn = document.getElementById('logout-btn');

// Common categories
const commonCategories = [
    { id: 'daily', name: 'Daily Tasks', icon: 'fas fa-sun' },
    { id: 'work', name: 'Work', icon: 'fas fa-briefcase' },
    { id: 'personal', name: 'Personal', icon: 'fas fa-heart' },
    { id: 'shopping', name: 'Shopping', icon: 'fas fa-shopping-cart' },
    { id: 'health', name: 'Health', icon: 'fas fa-dumbbell' }
];

// App State
let currentUser = null;
let todos = JSON.parse(localStorage.getItem('todos')) || {};
let categories = JSON.parse(localStorage.getItem('categories')) || commonCategories;
let activeCategory = 'daily';
let currentScheduledTime = null;
let editingTaskIndex = null;

// Initialize App
function initApp() {
    updateDate();
    renderCategories();
    loadTodos();
    updateProgress();
    setupEventListeners();
}

// Update current date
function updateDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// Update user info in header
function updateUserInfo() {
    if (currentUser) {
        welcomeMessage.textContent = `Hello, ${currentUser.name}!`;
        profilePhoto.src = currentUser.photo;
    }
}

// Setup event listeners
function setupEventListeners() {
    scheduleTime.addEventListener('change', updateSelectedTimeDisplay);
    scheduleAllBtn.addEventListener('click', scheduleAllTasks);
}

// Update selected time display
function updateSelectedTimeDisplay() {
    currentScheduledTime = scheduleTime.value;
    if (currentScheduledTime) {
        selectedTimeDisplay.textContent = `Scheduled time: ${formatTimeDisplay(currentScheduledTime)}`;
        selectedTimeDisplay.style.color = 'var(--accent-color)';
    } else {
        selectedTimeDisplay.textContent = 'No time scheduled';
        selectedTimeDisplay.style.color = 'var(--text-color)';
    }
}

// Format time for display
function formatTimeDisplay(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Check if task is overdue
function isTaskOverdue(taskTime) {
    if (!taskTime) return false;
    
    const now = new Date();
    const [hours, minutes] = taskTime.split(':');
    const taskDate = new Date();
    taskDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return now > taskDate && !isSameDay(now, taskDate);
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

// Render categories
function renderCategories() {
    categoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = `category ${category.id === activeCategory ? 'active' : ''}`;
        categoryElement.setAttribute('data-category', category.id);
        categoryElement.innerHTML = `
            <i class="${category.icon}"></i>
            <span>${category.name}</span>
        `;
        categoriesContainer.appendChild(categoryElement);
    });

    // Add "Add New" category button
    const addCategoryElement = document.createElement('div');
    addCategoryElement.className = 'category';
    addCategoryElement.setAttribute('data-category', 'add-new');
    addCategoryElement.innerHTML = `
        <i class="fas fa-plus"></i>
        <span>Add New</span>
    `;
    categoriesContainer.appendChild(addCategoryElement);

    // Add event listeners to categories
    document.querySelectorAll('.category').forEach(category => {
        category.addEventListener('click', handleCategoryClick);
    });
}

// Handle category click
function handleCategoryClick(e) {
    const category = e.currentTarget.getAttribute('data-category');
    
    if (category === 'add-new') {
        categoryModal.classList.remove('hidden');
        return;
    }

    activeCategory = category;
    currentScheduledTime = null;
    scheduleTime.value = '';
    updateSelectedTimeDisplay();
    
    document.querySelectorAll('.category').forEach(cat => {
        cat.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    currentCategory.textContent = categories.find(c => c.id === category)?.name || category;
    loadTodos();
    updateProgress();
}

// Load todos for current category
function loadTodos() {
    listContainer.innerHTML = '';
    const categoryTodos = todos[activeCategory] || [];
    
    // Sort tasks by time (scheduled tasks first, then unscheduled)
    categoryTodos.sort((a, b) => {
        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
    });
    
    categoryTodos.forEach((todo, index) => {
        const li = document.createElement('li');
        const overdue = isTaskOverdue(todo.time);
        li.className = `${
            todo.completed ? 'checked' : ''
        } ${
            todo.time ? 'scheduled' : ''
        } ${
            overdue ? 'overdue' : ''
        }`.trim();
        
        li.innerHTML = `
            <div class="task-content">
                <span class="task-text">${todo.text}</span>
                <div class="task-meta">
                    ${todo.time ? `
                        <span class="task-time-badge ${overdue ? 'task-overdue' : ''}">
                            <i class="fas fa-clock"></i> ${formatTimeDisplay(todo.time)}
                            ${overdue ? ' (Overdue)' : ''}
                        </span>
                    ` : ''}
                    <span>Added: ${new Date(todo.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" onclick="editTask(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="toggle-btn" onclick="toggleTask(${index})">
                    <i class="fas fa-${todo.completed ? 'undo' : 'check'}"></i>
                </button>
                <button class="delete-btn" onclick="deleteTask(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listContainer.appendChild(li);
    });
}

// Add new task
function addTask() {
    const taskText = inputBox.value.trim();
    if (taskText === '') {
        alert('Please enter a task!');
        return;
    }

    if (!todos[activeCategory]) {
        todos[activeCategory] = [];
    }

    const newTask = {
        text: taskText,
        completed: false,
        time: currentScheduledTime,
        createdAt: new Date().toISOString()
    };

    todos[activeCategory].push(newTask);
    saveTodos();
    loadTodos();
    updateProgress();
    
    inputBox.value = '';
    currentScheduledTime = null;
    scheduleTime.value = '';
    updateSelectedTimeDisplay();
}

// Edit task
function editTask(index) {
    const task = todos[activeCategory][index];
    editingTaskIndex = index;
    
    editTaskText.value = task.text;
    editTaskTime.value = task.time || '';
    
    editModal.classList.remove('hidden');
}

// Save edited task
function saveEditedTask() {
    if (editingTaskIndex === null) return;
    
    const newText = editTaskText.value.trim();
    if (!newText) {
        alert('Please enter task text!');
        return;
    }

    todos[activeCategory][editingTaskIndex].text = newText;
    todos[activeCategory][editingTaskIndex].time = editTaskTime.value;
    
    saveTodos();
    loadTodos();
    updateProgress();
    closeEditModalFunc();
}

// Close edit modal
function closeEditModalFunc() {
    editModal.classList.add('hidden');
    editingTaskIndex = null;
    editTaskText.value = '';
    editTaskTime.value = '';
}

// Schedule all tasks in current category
function scheduleAllTasks() {
    if (!currentScheduledTime) {
        alert('Please select a time first!');
        return;
    }

    if (!todos[activeCategory] || todos[activeCategory].length === 0) {
        alert('No tasks to schedule!');
        return;
    }

    if (confirm(`Schedule all tasks in ${currentCategory.textContent} for ${formatTimeDisplay(currentScheduledTime)}?`)) {
        todos[activeCategory].forEach(task => {
            if (!task.completed) {
                task.time = currentScheduledTime;
            }
        });
        
        saveTodos();
        loadTodos();
        alert(`All tasks scheduled for ${formatTimeDisplay(currentScheduledTime)}`);
    }
}

// Toggle task completion
function toggleTask(index) {
    if (todos[activeCategory] && todos[activeCategory][index]) {
        todos[activeCategory][index].completed = !todos[activeCategory][index].completed;
        saveTodos();
        loadTodos();
        updateProgress();
    }
}

// Delete task
function deleteTask(index) {
    if (todos[activeCategory] && todos[activeCategory][index]) {
        if (confirm('Are you sure you want to delete this task?')) {
            todos[activeCategory].splice(index, 1);
            saveTodos();
            loadTodos();
            updateProgress();
        }
    }
}

// Update progress tracker
function updateProgress() {
    const categoryTodos = todos[activeCategory] || [];
    if (categoryTodos.length === 0) {
        progressFill.style.width = '0%';
        progressText.textContent = '0% Complete';
        return;
    }

    const completedTasks = categoryTodos.filter(todo => todo.completed).length;
    const progress = (completedTasks / categoryTodos.length) * 100;
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${Math.round(progress)}% Complete`;
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// Save categories to localStorage
function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
    saveTodos();
}

// Add new category
function addNewCategory() {
    const categoryName = newCategoryName.value.trim();
    if (!categoryName) {
        alert('Please enter a category name!');
        return;
    }

    const newCategory = {
        id: categoryName.toLowerCase().replace(/\s+/g, '-'),
        name: categoryName,
        icon: 'fas fa-folder'
    };

    categories.push(newCategory);
    saveCategories();
    renderCategories();
    categoryModal.classList.add('hidden');
    newCategoryName.value = '';
}

// Login functionality
loginBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (!username) {
        alert('Please enter your name!');
        return;
    }

    currentUser = {
        name: username,
        photo: profilePhotoInput.files[0] ? URL.createObjectURL(profilePhotoInput.files[0]) : 'https://via.placeholder.com/50',
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUserInfo();
    
    loginSection.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    initApp();
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        
        usernameInput.value = '';
        profilePhotoInput.value = '';
        
        mainApp.classList.add('hidden');
        loginSection.classList.remove('hidden');
    }
});

// Check if user is already logged in
window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            
            if (currentUser && currentUser.name) {
                if (!currentUser.photo || currentUser.photo === 'https://via.placeholder.com/50') {
                    currentUser.photo = 'https://via.placeholder.com/50';
                }
                
                updateUserInfo();
                
                loginSection.classList.add('hidden');
                mainApp.classList.remove('hidden');
                initApp();
                return;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }
    
    loginSection.classList.remove('hidden');
    mainApp.classList.add('hidden');
});

// Event Listeners
addBtn.addEventListener('click', addTask);
inputBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

saveCategoryBtn.addEventListener('click', addNewCategory);
closeModal.addEventListener('click', () => categoryModal.classList.add('hidden'));

// Edit modal event listeners
saveEditBtn.addEventListener('click', saveEditedTask);
cancelEditBtn.addEventListener('click', closeEditModalFunc);
closeEditModal.addEventListener('click', closeEditModalFunc);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
        categoryModal.classList.add('hidden');
    }
    if (e.target === editModal) {
        closeEditModalFunc();
    }
});

// Make functions global for onclick attributes
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editTask = editTask;