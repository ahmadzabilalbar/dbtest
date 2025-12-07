// Local Storage Database Application
class LocalStorageDatabase {
    constructor() {
        this.data = [];
        this.headers = ['id', 'name', 'email', 'age', 'department', 'position'];
        this.nextId = 1;
        this.filteredData = [];
        this.currentEditId = null;
        this.storageKey = 'database_records';
        
        this.initializeEventListeners();
        this.loadFromLocalStorage();
        this.updateDisplay();
    }

    initializeEventListeners() {
        // Toggle buttons
        document.getElementById('toggleFormBtn').addEventListener('click', () => this.toggleSection('data-controls'));
        document.getElementById('clearStorageBtn').addEventListener('click', () => this.clearLocalStorage());
        
        // Form operations
        document.getElementById('dataForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addOrUpdateRecord();
        });
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelEdit());
        
        // Search and filter
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSearch());
        document.getElementById('sortBy').addEventListener('change', () => this.performSearch());
        document.getElementById('sortOrder').addEventListener('change', () => this.performSearch());
    }

    // Local Storage Operations
    saveToLocalStorage() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        this.showStatus(`Saved ${this.data.length} records to Local Storage`);
    }

    loadFromLocalStorage() {
        const storedData = localStorage.getItem(this.storageKey);
        if (storedData) {
            try {
                this.data = JSON.parse(storedData);
                this.nextId = this.data.length > 0 ? 
                    Math.max(...this.data.map(r => parseInt(r.id || 0))) + 1 : 1;
                this.showStatus(`Loaded ${this.data.length} records from Local Storage`);
            } catch (error) {
                this.showStatus('Error loading data from Local Storage', 'error');
                this.loadSampleData();
            }
        } else {
            this.loadSampleData();
        }
    }

    clearLocalStorage() {
        if (confirm('Are you sure you want to clear all data from Local Storage?')) {
            localStorage.removeItem(this.storageKey);
            this.data = [];
            this.nextId = 1;
            this.filteredData = [];
            this.updateDisplay();
            this.showStatus('Local Storage cleared');
        }
    }

    // Data Operations
    addOrUpdateRecord() {
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const age = document.getElementById('age').value;
        const department = document.getElementById('department').value.trim();
        const position = document.getElementById('position').value.trim();
        
        if (!name || !email) {
            this.showStatus('Name and Email are required fields', 'error');
            return;
        }
        
        if (this.currentEditId !== null) {
            // Update existing record
            const index = this.data.findIndex(r => r.id == this.currentEditId);
            if (index !== -1) {
                this.data[index] = {
                    ...this.data[index],
                    name, email, age, department, position
                };
                this.showStatus('Record updated successfully');
            }
            this.cancelEdit();
        } else {
            // Add new record
            const newRecord = {
                id: this.nextId++,
                name, email, age, department, position
            };
            this.data.push(newRecord);
            this.showStatus('Record added successfully');
        }
        
        this.resetForm();
        this.performSearch();
        this.saveToLocalStorage();
    }

    editRecord(id) {
        const record = this.data.find(r => r.id == id);
        if (!record) return;
        
        this.currentEditId = id;
        document.getElementById('id').value = record.id;
        document.getElementById('name').value = record.name;
        document.getElementById('email').value = record.email;
        document.getElementById('age').value = record.age || '';
        document.getElementById('department').value = record.department || '';
        document.getElementById('position').value = record.position || '';
        
        document.getElementById('addBtn').style.display = 'none';
        document.getElementById('updateBtn').style.display = 'inline-block';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
        this.showStatus('Editing record. Click Update to save changes.');
    }

    deleteRecord(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            this.data = this.data.filter(r => r.id != id);
            if (this.currentEditId == id) {
                this.cancelEdit();
            }
            this.performSearch();
            this.saveToLocalStorage();
            this.showStatus('Record deleted successfully');
        }
    }

    cancelEdit() {
        this.currentEditId = null;
        this.resetForm();
        document.getElementById('addBtn').style.display = 'inline-block';
        document.getElementById('updateBtn').style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'none';
        this.showStatus('Edit cancelled');
    }

    resetForm() {
        document.getElementById('id').value = '';
        document.getElementById('name').value = '';
        document.getElementById('email').value = '';
        document.getElementById('age').value = '';
        document.getElementById('department').value = '';
        document.getElementById('position').value = '';
    }

    // Search and Filter
    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const sortBy = document.getElementById('sortBy').value;
        const sortOrder = document.getElementById('sortOrder').value;
        
        let filtered = this.data;
        
        if (searchTerm) {
            filtered = this.data.filter(record => {
                return Object.values(record).some(value => 
                    value.toString().toLowerCase().includes(searchTerm)
                );
            });
        }
        
        // Sort
        filtered.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            // Handle numeric sorting
            if (sortBy === 'id' || sortBy === 'age') {
                aVal = parseInt(aVal) || 0;
                bVal = parseInt(bVal) || 0;
            } else {
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
        
        this.filteredData = filtered;
        this.updateTable();
    }

    resetSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('sortBy').value = 'id';
        document.getElementById('sortOrder').value = 'asc';
        this.performSearch();
        this.showStatus('Search reset');
    }

    // Display Updates
    updateTable() {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        
        if (this.filteredData.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.textContent = 'No records found';
            cell.style.textAlign = 'center';
            cell.style.padding = '20px';
            cell.style.color = '#6c757d';
            row.appendChild(cell);
            tbody.appendChild(row);
            return;
        }
        
        this.filteredData.forEach(record => {
            const row = document.createElement('tr');
            
            this.headers.forEach(header => {
                const cell = document.createElement('td');
                cell.textContent = record[header] || '';
                row.appendChild(cell);
            });
            
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn bg-slate-600 hover:bg-slate-700 text-white p-1.5 rounded mr-2 transition duration-300 border border-slate-500';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'Edit';
            editBtn.onclick = () => this.editRecord(record.id);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn bg-slate-600 hover:bg-slate-700 text-white p-1.5 rounded transition duration-300 border border-slate-500';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'Delete';
            deleteBtn.onclick = () => this.deleteRecord(record.id);
            
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            row.appendChild(actionsCell);
            
            tbody.appendChild(row);
        });
    }

    updateDisplay() {
        this.performSearch();
    }

    // Sample Data
    loadSampleData() {
        const sampleData = [
            { id: 1, name: 'John Doe', email: 'john.doe@example.com', age: 28, department: 'IT', position: 'Software Developer' },
            { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', age: 32, department: 'HR', position: 'HR Manager' },
            { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', age: 45, department: 'Finance', position: 'Senior Analyst' },
            { id: 4, name: 'Alice Brown', email: 'alice.brown@example.com', age: 29, department: 'Marketing', position: 'Marketing Specialist' },
            { id: 5, name: 'Charlie Wilson', email: 'charlie.wilson@example.com', age: 35, department: 'Sales', position: 'Sales Manager' },
            { id: 6, name: 'Diana Davis', email: 'diana.davis@example.com', age: 27, department: 'IT', position: 'Frontend Developer' },
            { id: 7, name: 'Ethan Miller', email: 'ethan.miller@example.com', age: 31, department: 'Operations', position: 'Operations Manager' },
            { id: 8, name: 'Fiona Garcia', email: 'fiona.garcia@example.com', age: 26, department: 'Customer Service', position: 'Customer Support' },
            { id: 9, name: 'George Martinez', email: 'george.martinez@example.com', age: 38, department: 'Finance', position: 'Accountant' },
            { id: 10, name: 'Hannah Lee', email: 'hannah.lee@example.com', age: 33, department: 'Marketing', position: 'Content Manager' },
            { id: 11, name: 'Ian Thompson', email: 'ian.thompson@example.com', age: 42, department: 'IT', position: 'DevOps Engineer' },
            { id: 12, name: 'Julia White', email: 'julia.white@example.com', age: 29, department: 'HR', position: 'Recruiter' },
            { id: 13, name: 'Kevin Clark', email: 'kevin.clark@example.com', age: 36, department: 'Sales', position: 'Account Executive' },
            { id: 14, name: 'Linda Rodriguez', email: 'linda.rodriguez@example.com', age: 41, department: 'Operations', position: 'Project Manager' },
            { id: 15, name: 'Michael Lewis', email: 'michael.lewis@example.com', age: 30, department: 'IT', position: 'Backend Developer' },
            { id: 16, name: 'Nancy Walker', email: 'nancy.walker@example.com', age: 34, department: 'Customer Service', position: 'Team Lead' },
            { id: 17, name: 'Oliver Hall', email: 'oliver.hall@example.com', age: 28, department: 'Marketing', position: 'Social Media Manager' },
            { id: 18, name: 'Patricia Allen', email: 'patricia.allen@example.com', age: 44, department: 'Finance', position: 'Financial Analyst' },
            { id: 19, name: 'Quentin Young', email: 'quentin.young@example.com', age: 32, department: 'IT', position: 'Database Administrator' },
            { id: 20, name: 'Rachel King', email: 'rachel.king@example.com', age: 27, department: 'HR', position: 'HR Assistant' },
            { id: 21, name: 'Steven Wright', email: 'steven.wright@example.com', age: 39, department: 'Sales', position: 'Regional Manager' },
            { id: 22, name: 'Tina Lopez', email: 'tina.lopez@example.com', age: 31, department: 'Operations', position: 'Business Analyst' },
            { id: 23, name: 'Uma Gonzalez', email: 'uma.gonzalez@example.com', age: 35, department: 'Customer Service', position: 'Customer Success Manager' },
            { id: 24, name: 'Victor Perez', email: 'victor.perez@example.com', age: 40, department: 'IT', position: 'System Administrator' },
            { id: 25, name: 'Wendy Carter', email: 'wendy.carter@example.com', age: 29, department: 'Marketing', position: 'SEO Specialist' },
            { id: 26, name: 'Xavier Mitchell', email: 'xavier.mitchell@example.com', age: 33, department: 'Finance', position: 'Budget Analyst' },
            { id: 27, name: 'Yara Roberts', email: 'yara.roberts@example.com', age: 26, department: 'HR', position: 'Training Coordinator' },
            { id: 28, name: 'Zachary Turner', email: 'zachary.turner@example.com', age: 37, department: 'Sales', position: 'Business Development' },
            { id: 29, name: 'Amanda Phillips', email: 'amanda.phillips@example.com', age: 30, department: 'Operations', position: 'Quality Assurance' },
            { id: 30, name: 'Brandon Campbell', email: 'brandon.campbell@example.com', age: 34, department: 'IT', position: 'Security Analyst' },
            { id: 31, name: 'Carla Parker', email: 'carla.parker@example.com', age: 28, department: 'Customer Service', position: 'Support Specialist' },
            { id: 32, name: 'Daniel Evans', email: 'daniel.evans@example.com', age: 42, department: 'Marketing', position: 'Brand Manager' },
            { id: 33, name: 'Emily Edwards', email: 'emily.edwards@example.com', age: 31, department: 'Finance', position: 'Tax Specialist' },
            { id: 34, name: 'Frank Collins', email: 'frank.collins@example.com', age: 36, department: 'HR', position: 'Compensation Manager' },
            { id: 35, name: 'Grace Hill', email: 'grace.hill@example.com', age: 29, department: 'Sales', position: 'Sales Representative' },
            { id: 36, name: 'Henry Green', email: 'henry.green@example.com', age: 43, department: 'Operations', position: 'Process Engineer' },
            { id: 37, name: 'Irene Adams', email: 'irene.adams@example.com', age: 27, department: 'IT', position: 'UI/UX Designer' },
            { id: 38, name: 'Jack Baker', email: 'jack.baker@example.com', age: 32, department: 'Customer Service', position: 'Escalation Manager' },
            { id: 39, name: 'Karen Nelson', email: 'karen.nelson@example.com', age: 38, department: 'Marketing', position: 'Digital Marketing Manager' },
            { id: 40, name: 'Larry Carter', email: 'larry.carter@example.com', age: 41, department: 'Finance', position: 'Controller' },
            { id: 41, name: 'Monica Rivera', email: 'monica.rivera@example.com', age: 30, department: 'HR', position: 'Employee Relations' },
            { id: 42, name: 'Nick Cooper', email: 'nick.cooper@example.com', age: 35, department: 'Sales', position: 'Key Account Manager' },
            { id: 43, name: 'Olivia Richardson', email: 'olivia.richardson@example.com', age: 29, department: 'Operations', position: 'Supply Chain Analyst' },
            { id: 44, name: 'Paul Cox', email: 'paul.cox@example.com', age: 33, department: 'IT', position: 'Mobile Developer' },
            { id: 45, name: 'Queenie Ward', email: 'queenie.ward@example.com', age: 28, department: 'Customer Service', position: 'Customer Experience' },
            { id: 46, name: 'Ryan Torres', email: 'ryan.torres@example.com', age: 37, department: 'Marketing', position: 'Product Manager' },
            { id: 47, name: 'Sandra Peterson', email: 'sandra.peterson@example.com', age: 40, department: 'Finance', position: 'Auditor' },
            { id: 48, name: 'Tom Reed', email: 'tom.reed@example.com', age: 34, department: 'HR', position: 'Organizational Development' },
            { id: 49, name: 'Ursula Gray', email: 'ursula.gray@example.com', age: 31, department: 'Sales', position: 'Channel Manager' },
            { id: 50, name: 'Victor Ramirez', email: 'victor.ramirez@example.com', age: 39, department: 'Operations', position: 'Logistics Manager' }
        ];
        
        this.data = sampleData;
        this.nextId = 51;
        this.updateDisplay();
        this.saveToLocalStorage();
        this.showStatus('Sample data loaded and saved to Local Storage');
    }

    // Toggle Section Visibility
    toggleSection(sectionClass) {
        const section = document.querySelector('.' + sectionClass);
        if (section) {
            const isVisible = section.style.display !== 'none';
            section.style.display = isVisible ? 'none' : 'block';
            
            // Update button text
            const button = document.getElementById('toggleFormBtn');
            
            if (button) {
                const icon = button.querySelector('i');
                const text = isVisible ? 'Show Record Form' : 'Hide Record Form';
                
                button.innerHTML = `<i class="${icon.className}"></i>${text}`;
            }
            
            this.showStatus(isVisible ? 'Section hidden' : 'Section shown');
        }
    }

    // Status Messages
    showStatus(message, type = 'success') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.style.background = type === 'error' ? '#f8d7da' : '#e9ecef';
        statusEl.style.color = type === 'error' ? '#721c24' : '#495057';
        statusEl.style.borderColor = type === 'error' ? '#f5c6cb' : '#dee2e6';
        
        setTimeout(() => {
            statusEl.textContent = 'Ready';
            statusEl.style.background = '#e9ecef';
            statusEl.style.color = '#495057';
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new LocalStorageDatabase();
});
