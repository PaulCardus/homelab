const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// General middleware
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// In-memory storage (replace with database later)
let todos = [
  { id: 1, text: 'Welcome to your Todo List!', completed: false, createdAt: new Date() },
  { id: 2, text: 'Build an amazing app', completed: false, createdAt: new Date() }
];
let nextId = 3;

// API Routes
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Todo text is required' });
  }
  
  const todo = {
    id: nextId++,
    text: text.trim(),
    completed: false,
    createdAt: new Date()
  };
  
  todos.push(todo);
  res.status(201).json(todo);
});

app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { text, completed } = req.body;
  
  const todoIndex = todos.findIndex(todo => todo.id === id);
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  if (text !== undefined) todos[todoIndex].text = text.trim();
  if (completed !== undefined) todos[todoIndex].completed = completed;
  todos[todoIndex].updatedAt = new Date();
  
  res.json(todos[todoIndex]);
});

app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todoIndex = todos.findIndex(todo => todo.id === id);
  
  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todos.splice(todoIndex, 1);
  res.status(204).send();
});

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), todos: todos.length });
});

app.get('/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date() });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Todo List App running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});