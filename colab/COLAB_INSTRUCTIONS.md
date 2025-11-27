# 📘 Amanda Google Colab Demo Instructions

This guide will help you run the Amanda platform on Google Colab and demo it to your professors using ngrok.

---

## 🎯 Overview

With this setup, you can:
- ✅ Run the entire Amanda stack (AI Backend + Backend + Frontend) in Google Colab
- ✅ Get public URLs via ngrok to share with anyone
- ✅ Demo the application without needing a server or VPS
- ✅ Present to professors with live, working URLs

**Time to Setup**: ~5-10 minutes  
**Cost**: $0 (Free tier of Colab and ngrok)

---

## 📋 Prerequisites

### 1. Google Account
- You need a Google account to use Google Colab
- Go to https://colab.research.google.com

### 2. ngrok Account (Free)
1. Go to https://ngrok.com
2. Click **Sign up** (free)
3. Verify your email
4. Go to https://dashboard.ngrok.com/get-started/your-authtoken
5. **Copy your auth token** (you'll need this later)

### 3. Anthropic API Key
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to **Settings** → **API Keys**
4. Create a new API key
5. **Copy the key** (you'll need this later)

> **Note**: Anthropic provides free credits for testing. You can also use other AI providers by modifying the AI Backend.

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Open the Colab Notebook

**Option A: Open from GitHub**
1. Go to https://colab.research.google.com
2. Click **File** → **Open notebook**
3. Click the **GitHub** tab
4. Enter the repository URL: `https://github.com/akhavansafaei/amanda`
5. Select the notebook: `colab/Amanda_Colab_Demo.ipynb`

**Option B: Direct Upload**
1. Download `Amanda_Colab_Demo.ipynb` from the repository
2. Go to https://colab.research.google.com
3. Click **File** → **Upload notebook**
4. Select the downloaded file

### Step 2: Run the Notebook Cells

Run each cell **in order** by clicking the ▶️ play button or pressing **Shift+Enter**.

#### Cell 1: Clone Repository
- Clones the Amanda repository from GitHub
- Wait for completion (~30 seconds)

#### Cell 2: Install Dependencies
- Installs all Python packages
- This may take 2-3 minutes
- You might see some warnings - this is normal

#### Cell 3: Configure Environment Variables
**IMPORTANT**: You'll be prompted to enter:

1. **ngrok Auth Token**:
   ```
   🔐 Enter your ngrok auth token:
   Get it from: https://dashboard.ngrok.com/get-started/your-authtoken
   ngrok Auth Token: [paste your token here]
   ```

2. **Anthropic API Key**:
   ```
   🤖 Enter your Anthropic API key:
   Get it from: https://console.anthropic.com/settings/keys
   Anthropic API Key: [paste your API key here]
   ```

> **Security Note**: These are entered securely using `getpass` - they won't be visible in the notebook

#### Cell 4: Setup ngrok
- Configures ngrok with your auth token
- Should complete instantly

#### Cell 5: Create Configuration Files
- Generates `.env` files for all services
- Completes in < 1 second

#### Cell 6: Start Services
- Starts AI Backend (gRPC)
- Starts Flask Backend (REST API + WebSocket)
- Starts Frontend (Static HTTP server)
- **Wait ~10 seconds** for all services to initialize

#### Cell 7: Create ngrok Tunnels
- Creates public URLs for your application
- **IMPORTANT**: Copy these URLs! They look like:
  ```
  🌐 Public URLs Created:
  ============================================================
  Backend API:  https://1234-abcd-5678.ngrok-free.app
  Frontend:     https://5678-efgh-9012.ngrok-free.app
  ============================================================
  ```

#### Cell 8: Update Frontend Configuration
- Automatically configures frontend to use ngrok backend URL
- No action needed

#### Cell 9: Display Access URLs
- Shows clickable links to access your application
- **Click the Frontend URL** to open Amanda

#### Cell 10: Monitor Services (Optional)
- Checks if all services are healthy
- Run this if something doesn't work

---

## 🎉 Using Amanda

Once all cells have run successfully:

### 1. Access the Application
- Click the **Frontend URL** from Cell 9
- You'll see the Amanda landing page

### 2. Create an Account
- Click **Sign up**
- Enter any email (doesn't need to be real)
- Create a password (min 8 characters)
- Click **Sign Up**

### 3. Start Chatting
- You'll be redirected to the dashboard
- Click **+ New Chat**
- Type a message like "Hello, I need relationship advice"
- Watch Amanda respond in real-time!

### 4. Demo Features
Show these features to your professors:

✅ **User Authentication**
   - Sign up, login, logout functionality
   - Session management

✅ **Real-time Streaming**
   - Messages stream token-by-token
   - Just like ChatGPT!

✅ **Multiple Conversations**
   - Create multiple chats
   - Switch between them
   - Chat history is saved

✅ **Modern UI**
   - Clean, professional interface
   - Responsive design
   - User-friendly

---

## 📱 Sharing with Professors

### Method 1: Share the URL
Simply share the Frontend URL:
```
https://xxxx-xxxx-xxxx.ngrok-free.app
```

Your professors can:
- Access it from any device
- Create their own account
- Test the full functionality

### Method 2: Live Demo
1. Share your screen
2. Open the Frontend URL
3. Walk through the features:
   - Account creation
   - Chat interface
   - Real-time AI responses
   - Multiple conversations

### Method 3: Screen Recording
Record a demo video:
1. Use OBS, Loom, or screen recorder
2. Show the complete workflow
3. Share the video link

---

## ⚙️ Advanced: Customization

### Change AI Model
Edit Cell 5 to use a different model:
```python
CLAUDE_MODEL=claude-3-opus-20240229  # More powerful
# or
CLAUDE_MODEL=claude-3-haiku-20240307  # Faster, cheaper
```

### Change System Prompt
Edit Cell 5 to customize Amanda's personality:
```python
SYSTEM_PROMPT=You are Amanda, a professional therapist specializing in couples counseling...
```

### Extend Session Time
Free Colab sessions last ~12 hours. To keep it running:
- Don't close the browser tab
- Run a cell occasionally to prevent disconnect
- Or upgrade to Colab Pro ($9.99/month) for longer sessions

---

## 🔧 Troubleshooting

### Problem: "ngrok auth token is invalid"
**Solution**: 
- Go to https://dashboard.ngrok.com/get-started/your-authtoken
- Copy the token again
- Re-run Cell 3 with the correct token

### Problem: "Anthropic API key is invalid"
**Solution**:
- Verify your API key at https://console.anthropic.com/settings/keys
- Make sure you copied the entire key
- Check if you have credits remaining
- Re-run Cell 3 with the correct key

### Problem: "Backend health check failed"
**Solution**:
1. Run the **Monitoring Cell** (Cell 10) to check status
2. Check if all services started properly
3. Re-run **Cell 6** to restart services
4. Wait 10-15 seconds for services to initialize

### Problem: "Frontend not loading"
**Solution**:
1. Check if the Frontend URL is correct
2. Try accessing the Backend URL first
3. Clear browser cache
4. Try a different browser or incognito mode

### Problem: "Services keep crashing"
**Solution**:
1. Run the **Cleanup Cell** at the end
2. Re-run from **Cell 6** onwards
3. Check the debug cell for error messages
4. Make sure you have enough Colab RAM (upgrade to Colab Pro if needed)

### Problem: "Can't send messages / WebSocket not connecting"
**Solution**:
1. Check if you're on ngrok's warning page - click **Visit Site**
2. Make sure both Backend and Frontend URLs are from ngrok
3. Check browser console for errors (F12)
4. Try creating a new chat

### Problem: "ngrok tunnel expired"
**Solution**:
- Free ngrok tunnels expire after 2 hours
- Re-run **Cell 7** to create new tunnels
- Then re-run **Cell 8** to update frontend config

---

## 💡 Tips for Demo Success

### Before the Demo
1. ✅ Test everything yourself first
2. ✅ Create a test account and send a few messages
3. ✅ Have your ngrok token and API key ready
4. ✅ Keep the URLs handy (copy them to a doc)
5. ✅ Prepare talking points about the architecture

### During the Demo
1. 🎯 Start with the big picture (show architecture)
2. 🎯 Explain the tech stack (Flask, WebSocket, gRPC, etc.)
3. 🎯 Show the live application (create account, chat)
4. 🎯 Highlight the real-time streaming
5. 🎯 Walk through the code structure briefly
6. 🎯 Mention future enhancements (VPS deployment, features)

### Demo Script Example
```
"I've built Amanda, a relationship support chatbot platform. 

It consists of three main components:
1. AI Backend - gRPC service using Claude AI
2. Flask Backend - REST API and WebSocket server
3. Frontend - Modern web interface

Let me show you the live demo running on Google Colab...

[Open Frontend URL]

I'll create a new account... and start a conversation...

As you can see, the responses stream in real-time, just like ChatGPT.

The platform supports multiple conversations, user authentication,
and persistent chat history.

Next steps include deploying to AWS/VPS for production use."
```

---

## 📊 Monitoring & Debugging

### View ngrok Dashboard
```
http://127.0.0.1:4040
```
Shows:
- All HTTP requests
- WebSocket connections
- Response times
- Error logs

> **Note**: This only works in Colab, not accessible from outside

### Check Service Logs
Run the Debug Cell to see:
- Which services are running
- Error messages if any crashed
- Recent log output

### Health Checks
Test these URLs directly:
- Backend health: `{BACKEND_URL}/health`
- Backend root: `{BACKEND_URL}/`
- Frontend: `{FRONTEND_URL}/`

---

## 🔒 Security Notes

### For Demo Purposes
- ✅ ngrok URLs are temporary and public
- ✅ Anyone with the link can access your demo
- ✅ Data is stored in Colab's temporary storage
- ✅ All data is lost when session ends

### Production Deployment
For real use, you'll need to:
- ❌ Don't use ngrok for production
- ✅ Deploy to proper VPS/AWS
- ✅ Use HTTPS with real SSL certificates
- ✅ Use production database (PostgreSQL)
- ✅ Implement rate limiting
- ✅ Add monitoring and logging
- ✅ Secure environment variables

---

## 🎓 Educational Value

### What This Demonstrates

**Full-Stack Development:**
- Backend API design (REST)
- Real-time communication (WebSocket)
- Database modeling (SQLAlchemy)
- Authentication & sessions

**Modern Architecture:**
- Microservices (AI Backend, Backend, Frontend)
- gRPC for inter-service communication
- WebSocket for real-time features
- Separation of concerns

**DevOps Skills:**
- Environment configuration
- Service orchestration
- Public URL tunneling
- Deployment strategies

---

## 📈 Next Steps After Demo

### 1. Local Development
Set up locally for faster iteration:
```bash
# Backend
cd services/backend
python app.py

# Frontend  
cd services/frontend
python -m http.server 8000
```

### 2. VPS Deployment
Deploy to DigitalOcean, Linode, or AWS:
- Use nginx as reverse proxy
- Setup SSL with Let's Encrypt
- Use systemd for service management
- Migrate to PostgreSQL

### 3. Feature Extensions
Add new capabilities:
- Voice input/output (TTS/ASR)
- File sharing
- Group chats
- Admin dashboard
- Analytics

### 4. Android App
Build the mobile app:
- Follow `services/android/README.md`
- Connect to your deployed backend
- Publish to Play Store

---

## 🆘 Getting Help

### Resources
- **Main README**: `/README.md`
- **Backend Docs**: `/services/backend/README.md`
- **Frontend Docs**: `/services/frontend/README.md`
- **Android Guide**: `/services/android/README.md`

### Common Issues
- Check the Troubleshooting section above
- Review service logs in Colab
- Test each service independently
- Verify API keys and tokens

### Support
- Open an issue on GitHub
- Check existing issues for solutions
- Review the architecture documentation

---

## ✅ Pre-Demo Checklist

Before showing to professors, verify:

- [ ] All Colab cells ran successfully
- [ ] Both ngrok URLs are working
- [ ] Can create an account
- [ ] Can send messages
- [ ] AI responses stream properly
- [ ] Can create multiple chats
- [ ] Can switch between chats
- [ ] Logout/login works
- [ ] URLs are saved/bookmarked
- [ ] Have backup plan (screen recording)

---

## 🎬 Sample Demo Timeline

**Total Time: 10-15 minutes**

1. **Introduction** (2 min)
   - Project overview
   - Tech stack
   - Architecture

2. **Live Demo** (5 min)
   - Open Frontend URL
   - Create account
   - Start conversation
   - Show real-time streaming
   - Create second chat
   - Switch between chats

3. **Code Walkthrough** (3 min)
   - Show project structure
   - Highlight key files
   - Explain data flow

4. **Future Plans** (2 min)
   - Production deployment
   - Feature roadmap
   - Android app

5. **Q&A** (3 min)
   - Answer questions
   - Show additional features

---

## 🌟 Success Metrics

Your demo is successful if you can show:

✅ **Working Authentication**
- Account creation
- Login/logout
- Session persistence

✅ **Real-time Chat**
- Send messages
- Receive streaming responses
- Proper error handling

✅ **Multiple Conversations**
- Create multiple chats
- Switch between them
- History persistence

✅ **Professional UI**
- Clean design
- Responsive layout
- Good UX

✅ **Technical Understanding**
- Explain architecture
- Discuss tech choices
- Answer questions confidently

---

## 🎉 You're Ready!

Follow these instructions, test everything beforehand, and you'll have a impressive demo to show your professors.

**Good luck with your demo! 🚀**

---

## 📞 Quick Reference

### Important URLs
- **Colab**: https://colab.research.google.com
- **ngrok Dashboard**: https://dashboard.ngrok.com
- **ngrok Token**: https://dashboard.ngrok.com/get-started/your-authtoken
- **Anthropic Console**: https://console.anthropic.com
- **GitHub Repo**: https://github.com/akhavansafaei/amanda

### Key Commands
```bash
# Clone repo (Cell 1)
git clone https://github.com/akhavansafaei/amanda.git

# Start backend (Cell 6)
python services/backend/app.py

# Start frontend (Cell 6)
python -m http.server 8000 --directory services/frontend

# Check health (Cell 10)
curl {BACKEND_URL}/health
```

### Troubleshooting Quick Fixes
1. Service crashed → Re-run Cell 6
2. ngrok expired → Re-run Cells 7-8
3. Frontend not loading → Clear cache, try incognito
4. WebSocket not connecting → Refresh page, check backend URL
5. API errors → Verify API key, check credits

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintainer**: Amanda Development Team
