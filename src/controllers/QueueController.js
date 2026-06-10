const QueueService = require('../services/QueueService');

/**
 * QueueController - Responsável por receber as requisições, interagir com o serviço e disparar notificações Socket.io.
 */
class QueueController {
    
    issue(req, res) {
        try {
            const { unitId, type, isPriority, isRemote, remoteToken } = req.body;
            const ticket = QueueService.issueTicket(unitId, type, isPriority, isRemote, remoteToken);
            
            // Emitir evento para a sala específica da unidade
            req.io.to('unit_' + unitId).emit('ticket_issued', ticket);
            // Avisar sobre mudança na fila geral
            req.io.to('unit_' + unitId).emit('queue_updated');
            // Avisa o admin sobre atualizações gerais
            req.io.to('admin').emit('admin_update');
            
            return res.status(201).json(ticket);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    call(req, res) {
        try {
            const { unitId, operatorId, boxNumber } = req.body;
            const ticket = QueueService.callNext(unitId, operatorId, boxNumber);
            
            if (!ticket) {
                return res.status(404).json({ message: "Nenhuma senha aguardando." });
            }

            // Emitir evento de chamada para a sala da unidade
            req.io.to('unit_' + unitId).emit('ticket_called', ticket);
            // Avisar sobre mudança na fila
            req.io.to('unit_' + unitId).emit('queue_updated');
            // Avisar admin
            req.io.to('admin').emit('admin_update');
            
            return res.json(ticket);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    finish(req, res) {
        try {
            const { id } = req.params;
            const ticket = QueueService.finishService(id);
            if (!ticket) return res.status(404).json({ error: "Senha não encontrada." });

            req.io.to('unit_' + ticket.unitId).emit('queue_updated');
            req.io.to('admin').emit('admin_update');

            return res.json(ticket);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    cancel(req, res) {
        try {
            const { id } = req.params;
            const ticket = QueueService.cancelService(id);
            if (!ticket) return res.status(404).json({ error: "Senha não encontrada." });

            req.io.to('unit_' + ticket.unitId).emit('queue_updated');
            req.io.to('admin').emit('admin_update');

            return res.json(ticket);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    recall(req, res) {
        try {
            const { id } = req.params;
            const status = QueueService.getTicketStatus(id);
            if (!status || !status.ticket) return res.status(404).json({ error: "Senha não encontrada." });

            req.io.to('unit_' + status.ticket.unitId).emit('ticket_called', status.ticket);
            return res.json(status.ticket);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }


    stats(req, res) {
        const { unitId } = req.query;
        if (!unitId) return res.status(400).json({ error: "unitId é necessário." });
        return res.json(QueueService.getReport(unitId));
    }

    waiting(req, res) {
        const { unitId } = req.query;
        if (!unitId) return res.status(400).json({ error: "unitId é necessário." });
        return res.json(QueueService.getWaitingTickets(unitId));
    }

    adminStats(req, res) {
        return res.json(QueueService.getAdminReport());
    }

    getUnits(req, res) {
        return res.json(QueueService.getAllUnits());
    }

    createUnit(req, res) {
        try {
            const { name, address } = req.body;
            if (!name || !address) return res.status(400).json({ error: "Nome e endereço são obrigatórios." });
            const unit = QueueService.createUnit(name, address);
            req.io.to('admin').emit('admin_update');
            return res.status(201).json(unit);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    getOperators(req, res) {
        return res.json(QueueService.getAllOperators());
    }

    createOperator(req, res) {
        try {
            const { username, name, role, unitId } = req.body;
            if (!username || !name || !unitId) return res.status(400).json({ error: "Dados incompletos." });
            const op = QueueService.createOperator(username, name, role, unitId);
            req.io.to('admin').emit('admin_update');
            return res.status(201).json(op);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    login(req, res) {
        try {
            const { username } = req.body;
            if (!username) return res.status(400).json({ error: "Username é obrigatório." });
            const session = QueueService.authenticate(username);
            if (!session) {
                return res.status(401).json({ error: "Operador não cadastrado." });
            }
            return res.json(session);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }

    getRemoteStatus(req, res) {
        try {
            const { token } = req.params;
            const status = QueueService.getTicketByRemoteToken(token);
            if (!status) {
                return res.status(404).json({ error: "Nenhuma senha ativa encontrada para este token." });
            }
            return res.json(status);
        } catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
}

module.exports = new QueueController();
