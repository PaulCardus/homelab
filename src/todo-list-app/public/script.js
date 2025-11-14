class TodoApp {
    constructor() {
        this.todos = [];
        this.initElements();
        this.bindEvents();
        this.loadTodos();
    }
    
    initElements() {
        this.todoForm = document.getElementById('todo-form');
        this.todoInput = document.getElementById('todo-input');
        this.todoList = document.getElementById('todo-list');
        this.totalCount = document.getElementById('total-count');
        this.pendingCount = document.getElementById('pending-count');
        this.completedCount = document.getElementById('completed-count');
        this.clearCompletedBtn = document.getElementById('clear-completed');
        this.toggleAllBtn = document.getElementById('toggle-all');
    }
    
    bindEvents() {
        this.todoForm.addEventListener('submit', (e) => this.addTodo(e));
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
        this.toggleAllBtn.addEventListener('click', () => this.toggleAll());
    }
    
    async loadTodos() {
        try {
            const response = await fetch('/api/todos');
            this.todos = await response.json();
            this.render();
        } catch (error) {
            console.error('Failed to load todos:', error);
        }
    }
    
    async addTodo(e) {
        e.preventDefault();
        const text = this.todoInput.value.trim();
        if (!text) return;
        
        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            
            if (response.ok) {
                const newTodo = await response.json();
                this.todos.push(newTodo);
                this.todoInput.value = '';
                this.render();
            }
        } catch (error) {
            console.error('Failed to add todo:', error);
        }
    }
    
    async toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (!todo) return;
        
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !todo.completed })
            });
            
            if (response.ok) {
                todo.completed = !todo.completed;
                this.render();
            }
        } catch (error) {
            console.error('Failed to toggle todo:', error);
        }
    }
    
    async deleteTodo(id) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                this.todos = this.todos.filter(t => t.id !== id);
                this.render();
            }
        } catch (error) {
            console.error('Failed to delete todo:', error);
        }
    }
    
    async editTodo(id, newText) {
        try {
            const response = await fetch(`/api/todos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newText })
            });
            
            if (response.ok) {
                const todo = this.todos.find(t => t.id === id);
                if (todo) todo.text = newText;
                this.render();
            }
        } catch (error) {
            console.error('Failed to edit todo:', error);
        }
    }
    
    async clearCompleted() {
        const completedTodos = this.todos.filter(t => t.completed);
        
        try {
            await Promise.all(
                completedTodos.map(todo => 
                    fetch(`/api/todos/${todo.id}`, { method: 'DELETE' })
                )
            );
            
            this.todos = this.todos.filter(t => !t.completed);
            this.render();
        } catch (error) {
            console.error('Failed to clear completed todos:', error);
        }
    }
    
    async toggleAll() {
        const allCompleted = this.todos.every(t => t.completed);
        const newState = !allCompleted;
        
        try {
            await Promise.all(
                this.todos.map(todo => 
                    fetch(`/api/todos/${todo.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: newState })
                    })
                )
            );
            
            this.todos.forEach(todo => todo.completed = newState);
            this.render();
        } catch (error) {
            console.error('Failed to toggle all todos:', error);
        }
    }
    
    render() {
        this.renderTodos();
        this.renderStats();
    }
    
    renderTodos() {
        if (this.todos.length === 0) {
            this.todoList.innerHTML = `
                <div class="empty-state">
                    <h3>No todos yet!</h3>
                    <p>Add your first task above to get started.</p>
                </div>
            `;
            return;
        }
        
        this.todoList.innerHTML = this.todos.map(todo => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}">
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    onchange="app.toggleTodo(${todo.id})"
                >
                <span class="todo-text" ondblclick="app.startEdit(this, ${todo.id})">${this.escapeHtml(todo.text)}</span>
                <div class="todo-actions">
                    <button class="btn-small btn-edit" onclick="app.startEdit(this.parentElement.previousElementSibling, ${todo.id})">Edit</button>
                    <button class="btn-small btn-delete" onclick="app.deleteTodo(${todo.id})">Delete</button>
                </div>
            </li>
        `).join('');
    }
    
    renderStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        
        this.totalCount.textContent = `${total} total`;
        this.pendingCount.textContent = `${pending} pending`;
        this.completedCount.textContent = `${completed} completed`;
    }
    
    startEdit(textElement, id) {
        const currentText = textElement.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.className = 'todo-text';
        
        input.addEventListener('blur', () => this.finishEdit(input, textElement, id));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.finishEdit(input, textElement, id);
            } else if (e.key === 'Escape') {
                textElement.textContent = currentText;
                textElement.style.display = 'block';
                input.remove();
            }
        });
        
        textElement.style.display = 'none';
        textElement.parentNode.insertBefore(input, textElement);
        input.focus();
        input.select();
    }
    
    finishEdit(input, textElement, id) {
        const newText = input.value.trim();
        if (newText && newText !== textElement.textContent) {
            this.editTodo(id, newText);
        } else {
            textElement.style.display = 'block';
        }
        input.remove();
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize app
const app = new TodoApp();