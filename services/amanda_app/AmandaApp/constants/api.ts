const BASE_URL = 'http://172.17.72.134:5000';

async function request(method: string, path: string, body?: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  checkAuth:   ()                 => request('GET',  '/api/auth/check'),
  listChats:   ()                 => request('GET',  '/api/chat/list'),
  createChat:  ()                 => request('POST', '/api/chat/create'),
  getMessages: (chatId: number)   => request('GET',  `/api/chat/${chatId}/messages`),
};

// Export BASE_URL so other files can use it for sockets and direct fetch calls
export const FLASK_BASE = BASE_URL;