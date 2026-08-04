// backend/src/lib/sse.js

const clients = new Map();

export function addClient(clientId, controller) {
  if (!clients.has(clientId)) {
    clients.set(clientId, new Set());
  }
  clients.get(clientId).add(controller);
  console.log(`✅ Client added: ${clientId} (total: ${clients.get(clientId).size})`);
}

export function removeClient(clientId, controller) {
  const clientSet = clients.get(clientId);
  if (clientSet) {
    clientSet.delete(controller);
    if (clientSet.size === 0) {
      clients.delete(clientId);
      console.log(`🗑️ Client removed: ${clientId}`);
    }
  }
}

export function sendEvent(clientId, event, data) {
  const clientSet = clients.get(clientId);
  
  console.log(`📤 sendEvent called:`, {
    clientId,
    event,
    hasClients: !!clientSet,
    clientCount: clientSet?.size || 0,
  });

  if (!clientSet || clientSet.size === 0) {
    console.warn(`⚠️ No clients connected for: ${clientId}`);
    return false;
  }

  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  let sentCount = 0;
  clientSet.forEach((controller) => {
    try {
      controller.enqueue(message);
      sentCount++;
    } catch (err) {
      console.error(`❌ Failed to send to ${clientId}:`, err);
      clientSet.delete(controller);
    }
  });

  console.log(`✅ Event sent to ${sentCount}/${clientSet.size} clients`);
  return sentCount > 0;
}