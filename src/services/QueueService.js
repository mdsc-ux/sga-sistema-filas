const QueueRepository = require('../repositories/QueueRepository');

/**
 * QueueService - Camada de Negócio. Implementa a lógica da "Fila Única Inteligente" e regras de negócio.
 */
class QueueService {
    constructor() {
        this.consecutivePriorityCalls = {}; // Chave: unitId, Valor: quantidade
    }

    issueTicket(unitId, type, isPriority, isRemote = false, remoteToken = null) {
        if (!unitId) throw new Error("A unidade é obrigatória.");
        if (!type) throw new Error("O tipo de serviço é obrigatório.");
        return QueueRepository.createTicket(unitId, type, isPriority, isRemote, remoteToken);
    }

    callNext(unitId, operatorId, boxNumber) {
        if (!unitId) throw new Error("A unidade é obrigatória para chamar.");
        
        const waiting = QueueRepository.findAllWaiting(unitId);
        if (waiting.length === 0) return null;

        const now = new Date();
        const STARVATION_THRESHOLD = 3 * 60 * 1000; // 3 minutos para promoção automática e evitar starvation no demo

        // 1. Verificar se há alguma senha normal sofrendo starvation (esperando mais que o threshold)
        const starvedTicket = waiting.find(t => !t.isPriority && (now - new Date(t.createdAt)) > STARVATION_THRESHOLD);

        let nextTicket = null;

        if (starvedTicket) {
            nextTicket = starvedTicket;
            // Reseta contador pois chamou normal
            this.consecutivePriorityCalls[unitId] = 0;
            console.log(`[QueueService] Senha ${nextTicket.code} chamada devido a estouro de tempo (Evitando Starvation).`);
        } else {
            // Filtrar prioritárias e normais
            const priorityTickets = waiting.filter(t => t.isPriority);
            const normalTickets = waiting.filter(t => !t.isPriority);

            const consecutive = this.consecutivePriorityCalls[unitId] || 0;

            // Regra 3:1 (3 prioritários para 1 normal)
            if (priorityTickets.length > 0 && (consecutive < 3 || normalTickets.length === 0)) {
                // Ordenar por ordem de chegada (mais antigo primeiro)
                priorityTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                nextTicket = priorityTickets[0];
                this.consecutivePriorityCalls[unitId] = consecutive + 1;
            } else if (normalTickets.length > 0) {
                // Chama normal
                normalTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                nextTicket = normalTickets[0];
                this.consecutivePriorityCalls[unitId] = 0;
            } else {
                // Caso reste apenas prioritários (ou o contador estourou mas não tem normais)
                priorityTickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                nextTicket = priorityTickets[0];
                this.consecutivePriorityCalls[unitId] = consecutive + 1;
            }
        }

        if (!nextTicket) return null;

        return QueueRepository.updateTicket(nextTicket.id, {
            status: 'CALLED',
            calledAt: new Date(),
            boxNumber: boxNumber,
            operatorId: operatorId
        });
    }

    finishService(ticketId) {
        return QueueRepository.updateTicket(ticketId, {
            status: 'FINISHED',
            finishedAt: new Date()
        });
    }

    cancelService(ticketId) {
        return QueueRepository.updateTicket(ticketId, {
            status: 'CANCELED',
            finishedAt: new Date()
        });
    }

    getWaitingTickets(unitId) {
        return QueueRepository.findAllWaiting(unitId);
    }

    getReport(unitId) {
        return QueueRepository.getStats(unitId);
    }

    getAdminReport() {
        return QueueRepository.getAdminStats();
    }

    getAllUnits() {
        return QueueRepository.findAllUnits();
    }

    createUnit(name, address) {
        return QueueRepository.createUnit(name, address);
    }

    getAllOperators() {
        return QueueRepository.findAllOperators();
    }

    createOperator(username, name, role, unitId) {
        return QueueRepository.createOperator(username, name, role, unitId);
    }

    authenticate(username) {
        const op = QueueRepository.findOperatorByUsername(username);
        if (!op) return null;
        const unit = QueueRepository.findUnitById(op.unitId);
        return { operator: op, unit };
    }

    getTicketPosition(ticketId) {
        const ticket = QueueRepository.findTicketById(ticketId);
        if (!ticket || ticket.status !== 'WAITING') return 0;

        const waiting = QueueRepository.findAllWaiting(ticket.unitId);
        
        let position = 0;
        for (const t of waiting) {
            if (t.id === ticketId) continue;
            
            if (ticket.isPriority) {
                // Se eu sou prioritário, só conto os prioritários mais antigos
                if (t.isPriority && new Date(t.createdAt) < new Date(ticket.createdAt)) {
                    position++;
                }
            } else {
                // Se eu sou normal, conto todos os prioritários (pois passam na frente)
                // e as normais mais antigas.
                if (t.isPriority) {
                    position++;
                } else if (new Date(t.createdAt) < new Date(ticket.createdAt)) {
                    position++;
                }
            }
        }
        return position;
    }

    getTicketStatus(ticketId) {
        const ticket = QueueRepository.findTicketById(ticketId);
        if (!ticket) return null;
        
        const position = this.getTicketPosition(ticketId);
        const stats = QueueRepository.getStats(ticket.unitId);
        
        // Estimativa simples: 3 minutos por pessoa na fila de espera
        const waitTime = position * 3;
        
        return {
            ticket,
            position,
            estimatedWaitMinutes: waitTime || 2
        };
    }

    getTicketByRemoteToken(remoteToken) {
        const ticket = QueueRepository.findTicketByRemoteToken(remoteToken);
        if (!ticket) return null;
        return this.getTicketStatus(ticket.id);
    }
}

module.exports = new QueueService();
