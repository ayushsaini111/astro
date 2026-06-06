// In-memory store of SSE clients
// Map<userId, Set<ReadableStreamController>>
const clients = new Map();

export function addClient(userId, controller) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(controller);
}

export function removeClient(userId, controller) {
  clients.get(userId)?.delete(controller);
  if (clients.get(userId)?.size === 0) clients.delete(userId);
}

export function sendEvent(userId, type, data) {
  const userClients = clients.get(userId);
  if (!userClients) return;
  const message = `data: ${JSON.stringify({ type, data })}\n\n`;
  for (const controller of userClients) {
    try { controller.enqueue(message); } catch (e) { userClients.delete(controller); }
  }
}