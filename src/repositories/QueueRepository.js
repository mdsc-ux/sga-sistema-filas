/**
 * QueueRepository - Responsável pelo armazenamento e persistência dos dados (Simulado em memória com dados avançados)
 */
class QueueRepository {
    constructor() {
        this.units = [
            { id: '1', name: 'Clínica Central', address: 'Av. Paulista, 1000' },
            { id: '2', name: 'Secretaria de Saúde', address: 'Rua das Flores, 123' },
            { id: '3', name: 'Unidade Zona Sul', address: 'Av. Ibirapuera, 500' }
        ];

        this.operators = [
            { id: 'op1', username: 'joao', name: 'João Silva', role: 'OPERATOR', unitId: '1' },
            { id: 'op2', username: 'maria', name: 'Maria Souza', role: 'OPERATOR', unitId: '2' },
            { id: 'op3', username: 'pedro', name: 'Pedro Santos', role: 'OPERATOR', unitId: '3' },
            { id: 'admin', username: 'admin', name: 'Administrador', role: 'ADMIN', unitId: '1' }
        ];

        this.tickets = [];
        this.ticketCounters = {}; // Chave: `${unitId}_${category}`
    }

    // Gerenciamento de Unidades (RF10)
    createUnit(name, address) {
        const unit = {
            id: String(this.units.length + 1),
            name,
            address
        };
        this.units.push(unit);
        return unit;
    }

    findAllUnits() {
        return this.units;
    }

    findUnitById(id) {
        return this.units.find(u => u.id === id);
    }

    // Gerenciamento de Operadores (RF09)
    createOperator(username, name, role, unitId) {
        if (this.operators.some(o => o.username === username.toLowerCase())) {
            throw new Error("Nome de usuário já cadastrado.");
        }
        const operator = {
            id: 'op_' + Date.now().toString(),
            username: username.toLowerCase(),
            name,
            role: role || 'OPERATOR',
            unitId
        };
        this.operators.push(operator);
        return operator;
    }

    findAllOperators() {
        return this.operators;
    }

    findOperatorByUsername(username) {
        return this.operators.find(o => o.username === username.toLowerCase());
    }

    // Gerenciamento de Senhas (RF01, RF02, RF08, RF10)
    createTicket(unitId, type, isPriority, isRemote = false, remoteToken = null) {
        const category = isPriority ? 'PREFERENTIAL' : 'NORMAL';
        const counterKey = `${unitId}_${category}`;
        
        if (!this.ticketCounters[counterKey]) {
            this.ticketCounters[counterKey] = 0;
        }
        this.ticketCounters[counterKey]++;

        const prefix = isPriority ? 'P' : (type.substring(0, 1).toUpperCase() || 'A');
        const number = String(this.ticketCounters[counterKey]).padStart(3, '0');
        const code = `${prefix}${number}`;

        const ticket = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            code,
            unitId,
            type,
            isPriority,
            isRemote,
            remoteToken,
            status: 'WAITING', // WAITING, CALLED, SERVING, FINISHED, CANCELED
            createdAt: new Date(),
            calledAt: null,
            finishedAt: null,
            boxNumber: null,
            operatorId: null
        };

        this.tickets.push(ticket);
        return ticket;
    }

    findAllWaiting(unitId) {
        return this.tickets.filter(t => t.status === 'WAITING' && t.unitId === unitId);
    }

    findTicketById(id) {
        return this.tickets.find(t => t.id === id);
    }

    findTicketByRemoteToken(remoteToken) {
        return this.tickets.find(t => t.remoteToken === remoteToken && ['WAITING', 'CALLED', 'SERVING'].includes(t.status));
    }

    updateTicket(id, updates) {
        const index = this.tickets.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tickets[index] = { ...this.tickets[index], ...updates };
            return this.tickets[index];
        }
        return null;
    }

    // Relatórios e Estatísticas (RF05, RF07)
    getStats(unitId) {
        const unitTickets = this.tickets.filter(t => t.unitId === unitId);
        const waiting = unitTickets.filter(t => t.status === 'WAITING');
        const finished = unitTickets.filter(t => t.status === 'FINISHED');

        return {
            total: unitTickets.length,
            waiting: waiting.length,
            finished: finished.length,
            averageWaitTime: this.calculateAverageWaitTime(unitTickets)
        };
    }

    calculateAverageWaitTime(ticketsList) {
        const finished = ticketsList.filter(t => t.status === 'FINISHED' && t.calledAt);
        if (finished.length === 0) return 0;
        
        const sum = finished.reduce((acc, t) => {
            return acc + (new Date(t.calledAt) - new Date(t.createdAt));
        }, 0);
        
        // Retorna o tempo em minutos (arredondado) ou segundos se for muito baixo
        const avgMs = sum / finished.length;
        return Math.max(1, Math.round(avgMs / 1000 / 60)); // Mínimo de 1 min se houver espera
    }

    getAdminStats() {
        // Estatísticas consolidadas para o painel administrativo
        const totalTickets = this.tickets.length;
        const waiting = this.tickets.filter(t => t.status === 'WAITING').length;
        const finished = this.tickets.filter(t => t.status === 'FINISHED').length;
        const canceled = this.tickets.filter(t => t.status === 'CANCELED').length;

        // Tempo médio global de espera
        const finishedWithDates = this.tickets.filter(t => t.status === 'FINISHED' && t.calledAt);
        const averageWaitTime = this.calculateAverageWaitTime(this.tickets);

        // Tempo médio de atendimento (finishedAt - calledAt)
        let averageServiceTime = 0;
        const servicedTickets = this.tickets.filter(t => t.status === 'FINISHED' && t.calledAt && t.finishedAt);
        if (servicedTickets.length > 0) {
            const serviceSum = servicedTickets.reduce((acc, t) => {
                return acc + (new Date(t.finishedAt) - new Date(t.calledAt));
            }, 0);
            averageServiceTime = Math.max(1, Math.round((serviceSum / servicedTickets.length) / 1000 / 60));
        }

        // Estatísticas por Unidade
        const statsByUnit = this.units.map(unit => {
            const unitTickets = this.tickets.filter(t => t.unitId === unit.id);
            return {
                unitId: unit.id,
                name: unit.name,
                total: unitTickets.length,
                waiting: unitTickets.filter(t => t.status === 'WAITING').length,
                finished: unitTickets.filter(t => t.status === 'FINISHED').length,
                avgWait: this.calculateAverageWaitTime(unitTickets)
            };
        });

        // Desempenho dos Operadores
        const operatorPerformance = this.operators.map(op => {
            const opTickets = this.tickets.filter(t => t.operatorId === op.id && t.status === 'FINISHED');
            let avgTime = 0;
            if (opTickets.length > 0) {
                const sum = opTickets.reduce((acc, t) => acc + (new Date(t.finishedAt) - new Date(t.calledAt)), 0);
                avgTime = Math.max(1, Math.round((sum / opTickets.length) / 1000 / 60));
            }
            return {
                operatorName: op.name,
                username: op.username,
                unitName: this.units.find(u => u.id === op.unitId)?.name || 'Sem Unidade',
                finishedCount: opTickets.length,
                avgServiceTime: avgTime
            };
        });

        return {
            summary: {
                totalTickets,
                waiting,
                finished,
                canceled,
                averageWaitTime,
                averageServiceTime
            },
            units: statsByUnit,
            operators: operatorPerformance,
            rawTickets: this.tickets.map(t => ({
                code: t.code,
                unit: this.units.find(u => u.id === t.unitId)?.name || 'Desconhecido',
                type: t.type,
                isPriority: t.isPriority,
                isRemote: t.isRemote,
                status: t.status,
                waitTime: t.calledAt ? Math.round((new Date(t.calledAt) - new Date(t.createdAt)) / 1000 / 60) : 0,
                serviceTime: (t.calledAt && t.finishedAt) ? Math.round((new Date(t.finishedAt) - new Date(t.calledAt)) / 1000 / 60) : 0
            }))
        };
    }
}

module.exports = new QueueRepository();
