// CSV Database Application
class CSVDatabase {
    constructor() {
        this.data = [];
        this.headers = ['id', 'name', 'email', 'age', 'department', 'position'];
        this.currentFile = null;
        this.nextId = 1;
        this.filteredData = [];
        this.currentEditId = null;
        
        this.initializeEventListeners();
        this.updateToggleButtonText();
        this.loadSampleData();
        this.updateDisplay();
    }

    initializeEventListeners() {
        // Toggle buttons
        document.getElementById('toggleFileBtn').addEventListener('click', () => this.toggleSection('file-controls'));
        document.getElementById('toggleFormBtn').addEventListener('click', () => this.toggleSection('data-controls'));
        
        // File operations
        document.getElementById('loadDataBtn').addEventListener('click', () => this.loadSpecificFile('data.csv'));
        document.getElementById('saveFileBtn').addEventListener('click', () => this.saveToFile());
        document.getElementById('downloadFileBtn').addEventListener('click', () => this.downloadFile());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearData());
        
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

    // CSV Parsing and Stringify
    parseCSV(csvText) {
        const lines = csvText.split(/\r?\n/);
        if (lines.length === 0) return [];
        
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = this.parseCSVLine(lines[i]);
            const record = {};
            
            headers.forEach((header, index) => {
                record[header] = values[index] || '';
            });
            
            data.push(record);
        }
        
        return data;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    stringifyCSV(data) {
        if (data.length === 0) return this.headers.join(',');
        
        const headers = Object.keys(data[0]);
        const csvLines = [headers.join(',')];
        
        data.forEach(record => {
            const values = headers.map(header => {
                const value = record[header] || '';
                if (value.toString().includes(',') || value.toString().includes('"') || value.toString().includes('\n')) {
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvLines.push(values.join(','));
        });
        
        return csvLines.join('\n');
    }

    // File Operations
    loadFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.txt';
        input.onchange = (e) => this.handleFileSelect(e);
        input.click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvText = e.target.result;
                this.data = this.parseCSV(csvText);
                this.currentFile = file.name;
                this.nextId = this.data.length > 0 ? 
                    Math.max(...this.data.map(r => parseInt(r.id || 0))) + 1 : 1;
                
                this.updateFileInfo();
                this.updateDisplay();
                this.showStatus(`Loaded ${file.name} with ${this.data.length} records`);
            } catch (error) {
                this.showStatus('Error loading file: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    saveToFile() {
        this.currentFile = 'data.csv';
        const csvText = this.stringifyCSV(this.data);
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        
        // In a real application, you might want to use the File System Access API
        // For now, we'll just download it
        this.downloadBlob(blob, this.currentFile);
        this.showStatus(`Saved ${this.currentFile}`);
    }

    downloadFile() {
        const csvText = this.stringifyCSV(this.data);
        const fileName = this.currentFile || 'database.csv';
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, fileName);
        this.showStatus(`Downloaded ${fileName}`);
    }

    downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data?')) {
            this.data = [];
            this.nextId = 1;
            this.currentFile = null;
            this.filteredData = [];
            this.updateFileInfo();
            this.updateDisplay();
            this.showStatus('Data cleared');
        }
    }

    loadSpecificFile(fileName) {
        // Create a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.style.display = 'none';
        
        // Add event listener for when user selects a file
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.name === fileName) {
                this.handleFileSelect({ target: { files: [file] } });
            } else if (file) {
                this.showStatus(`Please select ${fileName} file`, 'error');
                // Reset the input
                input.value = '';
            }
        });
        
        // Add the input to the DOM
        document.body.appendChild(input);
        
        // Automatically trigger the file input
        input.click();
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
    updateFileInfo() {
        document.getElementById('fileName').textContent = this.currentFile ? 
            `File: ${this.currentFile}` : 'No file loaded';
        document.getElementById('rowCount').textContent = `Records: ${this.data.length}`;
    }

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
        this.updateFileInfo();
        this.performSearch();
    }

    // Sample Data
    loadSampleData() {
        // Try to load data.csv automatically
        this.loadDataFile();
    }

    loadDataFile() {
        // Automatically try to load data.csv using user input method
        this.showStatus('Attempting to load data.csv...');
        
        // Create a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.style.display = 'none';
        
        // Add event listener for when user selects a file
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.name === 'data.csv') {
                this.handleFileSelect({ target: { files: [file] } });
            } else if (file) {
                this.showStatus('Please select data.csv file', 'error');
                // Reset the input
                input.value = '';
            }
        });
        
        // Add the input to the DOM
        document.body.appendChild(input);
        
        // Automatically trigger the file input
        input.click();
        
        // If user cancels or doesn't select data.csv, load sample data after a short delay
        setTimeout(() => {
            if (!this.data.length || this.currentFile !== 'data.csv') {
                this.loadSampleDataFallback();
            }
        }, 2000);
    }

    loadSampleDataFallback() {
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
        this.currentFile = 'data.csv';
        this.updateDisplay();
        this.showStatus('Sample data loaded. To load data.csv, use the File Management section.');
    }

    // Toggle Section Visibility
    toggleSection(sectionClass) {
        const section = document.querySelector('.' + sectionClass);
        if (section) {
            const isVisible = section.style.display !== 'none';
            section.style.display = isVisible ? 'none' : 'block';
            
            // Update button text
            const button = sectionClass === 'file-controls' ? 
                document.getElementById('toggleFileBtn') : 
                document.getElementById('toggleFormBtn');
            
            if (button) {
                const icon = button.querySelector('i');
                const text = isVisible ? 
                    (sectionClass === 'file-controls' ? 'Show File Management' : 'Show Record Form') :
                    (sectionClass === 'file-controls' ? 'Toggle File Management' : 'Toggle Record Form');
                
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
    new CSVDatabase();
});
