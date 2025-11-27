# Amanda Frontend

The Amanda Frontend is a clean, modern web interface for the relationship support chatbot. Built with vanilla HTML, CSS, and JavaScript (no frameworks), it provides a ChatGPT-like experience for users to interact with the AI.

## Features

- **Authentication**: User signup and login with session management
- **Real-time Chat**: WebSocket-based streaming for instant AI responses
- **Chat Management**: Create and switch between multiple conversations
- **Responsive Design**: Optimized for desktop, works on mobile
- **Modern UI**: Clean, professional interface inspired by popular AI chat apps

## Architecture

```
frontend/
├── index.html           # Landing page (auth redirect)
├── auth/               # Authentication pages
│   ├── login.html     # Login form
│   └── signup.html    # Registration form
├── dashboard/         # Main chat interface
│   └── index.html    # Chat dashboard
└── static/           # Static assets
    ├── css/         # Stylesheets
    │   ├── common.css      # Shared styles, variables, utilities
    │   ├── auth.css        # Authentication page styles
    │   └── dashboard.css   # Dashboard/chat styles
    ├── js/          # JavaScript modules
    │   ├── api.js         # REST API client
    │   ├── websocket.js   # WebSocket client
    │   └── dashboard.js   # Dashboard logic
    └── assets/      # Images, icons, etc.
        └── .gitkeep
```

## Setup Instructions

### Prerequisites

- A web server to serve the HTML files (Python's http.server, VS Code Live Server, etc.)
- Amanda Backend running on `http://localhost:5000`
- AI Backend running on `localhost:50051`

### Running the Frontend

**Option 1: Python HTTP Server**

```bash
cd services/frontend
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

**Option 2: VS Code Live Server**

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

**Option 3: Node.js http-server**

```bash
npm install -g http-server
cd services/frontend
http-server -p 8000
```

### Configuration

The frontend is configured to connect to:
- **Backend API**: `http://localhost:5000`
- **WebSocket**: `http://localhost:5000`

To change these URLs, edit:
- `static/js/api.js`: Change `API_BASE_URL`
- `static/js/websocket.js`: Change `SOCKET_URL`

## Page-by-Page Guide

### 1. Landing Page (`index.html`)

- Checks authentication status via `/api/auth/check`
- Redirects to dashboard if authenticated
- Redirects to login if not authenticated
- Shows loading spinner during check

### 2. Login Page (`auth/login.html`)

**Features:**
- Email and password input fields
- Form validation
- Error message display
- Link to signup page
- Auto-redirect to dashboard on success

**Validation:**
- Email and password required
- Basic email format check

### 3. Signup Page (`auth/signup.html`)

**Features:**
- Email, password, and confirm password fields
- Comprehensive validation
- Error message display
- Link to login page
- Auto-redirect to dashboard on success

**Validation:**
- All fields required
- Email format validation
- Password minimum 8 characters
- Passwords must match

### 4. Dashboard (`dashboard/index.html`)

**Features:**
- Three-column layout:
  - **Left Sidebar**: Chat list, new chat button
  - **Main Area**: Messages display, input area
  - **Profile Modal**: User info, logout button

**Functionality:**
- Create new chats
- Switch between chats
- Send messages
- Real-time streaming responses
- Auto-scroll to bottom
- Message timestamps
- Profile management

## Styling Guide

### CSS Variables

The design system uses CSS variables for easy customization. Edit `static/css/common.css`:

```css
:root {
    /* Colors */
    --primary-color: #0066cc;          /* Main brand color */
    --secondary-color: #f0f2f5;        /* Light backgrounds */
    --text-primary: #1a1a1a;           /* Main text */
    --text-secondary: #666;            /* Secondary text */
    --border-color: #e0e0e0;           /* Borders */
    
    /* Chat colors */
    --user-message-bg: #0066cc;        /* User message bubble */
    --assistant-message-bg: #f0f2f5;   /* AI message bubble */
    
    /* Spacing, borders, shadows... */
}
```

### Customization Examples

**Change primary color:**
```css
--primary-color: #8b5cf6;  /* Purple */
```

**Change chat bubble colors:**
```css
--user-message-bg: #10b981;        /* Green */
--assistant-message-bg: #f3f4f6;   /* Light gray */
```

**Modify spacing:**
```css
--spacing-md: 20px;  /* Increase default spacing */
```

## JavaScript Modules

### `api.js` - REST API Client

```javascript
import { api } from './static/js/api.js';

// Authentication
await api.signup('user@example.com', 'password');
await api.login('user@example.com', 'password');
await api.logout();
const { authenticated } = await api.checkAuth();

// User
const profile = await api.getProfile();

// Chats
const { chats } = await api.listChats();
const { chat_id } = await api.createChat();
const { messages } = await api.getChatMessages(chatId);
```

### `websocket.js` - WebSocket Client

```javascript
import { chatSocket } from './static/js/websocket.js';

// Connect
await chatSocket.connect();

// Send message
chatSocket.sendMessage(chatId, message);

// Listen for events
chatSocket.onToken((data) => {
    console.log('Token:', data.text);
});

chatSocket.onComplete((data) => {
    console.log('Complete:', data.full_text);
});

chatSocket.onError((data) => {
    console.error('Error:', data.message);
});

// Disconnect
chatSocket.disconnect();
```

### `dashboard.js` - Main Application

The dashboard module orchestrates the entire chat interface:
- Authentication checking
- Chat list management
- Message rendering
- WebSocket communication
- UI state management

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Required Features**:
  - ES6+ JavaScript (modules, async/await, classes)
  - Fetch API
  - CSS Grid & Flexbox
  - WebSocket/Socket.IO support

## Development Tips

### Debugging

Open browser DevTools (F12) to:
- **Console**: View logs and errors
- **Network**: Monitor API requests and WebSocket messages
- **Application**: Check session cookies

### Common Issues

**CORS Errors**
- Ensure backend CORS is configured for `http://localhost:8000`
- Check `CORS_ORIGINS` in backend `.env`

**WebSocket Not Connecting**
- Verify backend is running
- Check browser console for errors
- Ensure session is valid (logged in)

**Messages Not Sending**
- Check if chat is selected
- Verify WebSocket connection
- Check backend logs for errors

## Extending the Frontend

### Adding a New Page

1. Create HTML file (e.g., `settings.html`)
2. Link common CSS: `<link rel="stylesheet" href="/static/css/common.css">`
3. Create page-specific CSS if needed
4. Add JavaScript module for functionality
5. Update navigation links

### Adding New API Endpoints

1. Add method to `api.js`:
   ```javascript
   async myNewEndpoint() {
       return this.request('/api/my/endpoint', {
           method: 'POST',
           body: JSON.stringify({ data })
       });
   }
   ```

2. Use in your page:
   ```javascript
   import { api } from './static/js/api.js';
   const result = await api.myNewEndpoint();
   ```

### Customizing Message Display

Edit `dashboard.js` > `renderMessage()` to:
- Add markdown rendering
- Support code blocks
- Display images/files
- Add message actions (copy, delete, etc.)

### Adding Voice Input

```javascript
// Add to dashboard.js
const recognition = new webkitSpeechRecognition();
recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    messageInput.value = text;
};
```

## Future Enhancements

Students can extend the frontend with:

- **Rich Text**: Markdown rendering for AI responses
- **Code Highlighting**: Syntax highlighting for code blocks
- **File Upload**: Share images/documents in chat
- **Voice Input**: Speech-to-text for messages
- **Voice Output**: Text-to-speech for AI responses
- **Dark Mode**: Theme switcher
- **Accessibility**: ARIA labels, keyboard navigation
- **Offline Mode**: Service worker for offline access
- **PWA**: Install as mobile/desktop app
- **Chat Export**: Download chat history
- **Search**: Search through messages
- **Settings Page**: Customize preferences
- **Notifications**: Desktop notifications for new messages

## Security Considerations

- **XSS Prevention**: All user input is escaped before rendering
- **CSRF Protection**: Session cookies with SameSite flag
- **HTTPS**: Use HTTPS in production
- **Session Management**: Automatic logout on session expiry
- **Input Validation**: Client-side validation for all forms

## Deployment

For production deployment:

1. **Build Process**: Consider bundling JS modules
2. **Minification**: Minify CSS and JS files
3. **CDN**: Serve static assets from CDN
4. **HTTPS**: Use SSL/TLS certificates
5. **Environment Config**: Use environment-specific API URLs
6. **Caching**: Set appropriate cache headers
7. **Compression**: Enable gzip/brotli compression

## License

Educational project - feel free to modify and extend!

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend is running
3. Check network requests in DevTools
4. Review backend logs
