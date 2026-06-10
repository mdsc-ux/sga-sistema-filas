const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const QueueController = require('./controllers/QueueController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Middleware para injetar o IO nas requisições
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rotas da API - Senhas e Atendimento
app.post('/api/tickets', (req, res) => QueueController.issue(req, res));
app.post('/api/tickets/call', (req, res) => QueueController.call(req, res));
app.post('/api/tickets/:id/recall', (req, res) => QueueController.recall(req, res));
app.put('/api/tickets/:id/finish', (req, res) => QueueController.finish(req, res));
app.put('/api/tickets/:id/cancel', (req, res) => QueueController.cancel(req, res));
app.get('/api/tickets/stats', (req, res) => QueueController.stats(req, res));
app.get('/api/tickets/waiting', (req, res) => QueueController.waiting(req, res));
app.get('/api/tickets/remote/:token', (req, res) => QueueController.getRemoteStatus(req, res));


// Rotas da API - Configuração, Unidades e Operadores
app.get('/api/units', (req, res) => QueueController.getUnits(req, res));
app.post('/api/units', (req, res) => QueueController.createUnit(req, res));
app.get('/api/operators', (req, res) => QueueController.getOperators(req, res));
app.post('/api/operators', (req, res) => QueueController.createOperator(req, res));
app.post('/api/auth/login', (req, res) => QueueController.login(req, res));
app.get('/api/admin/stats', (req, res) => QueueController.adminStats(req, res));

// Socket.io - Salas de Comunicação em Tempo Real (Justificativa no Plano de Implementação)
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);
    
    // Une o cliente a uma sala baseada na unidade física (Totem, Painel TV, Operador)
    socket.on('join_unit', ({ unitId }) => {
        socket.join('unit_' + unitId);
        console.log(`Socket ${socket.id} entrou na sala unit_${unitId}`);
    });
    
    // Une o cliente ao painel administrativo
    socket.on('join_admin', () => {
        socket.join('admin');
        console.log(`Socket ${socket.id} entrou na sala admin`);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`SGA Rodando na porta ${PORT}`);
});
