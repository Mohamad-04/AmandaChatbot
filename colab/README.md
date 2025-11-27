# 🚀 Amanda Google Colab Demo

Run the entire Amanda platform in Google Colab and share it publicly via ngrok!

## 📁 Files

- **`Amanda_Colab_Demo.ipynb`** - Main Colab notebook (open this in Colab)
- **`COLAB_INSTRUCTIONS.md`** - Detailed step-by-step instructions
- **`README.md`** - This file

## ⚡ Quick Start

### 1. Open in Google Colab

Click here to open the notebook directly:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/akhavansafaei/amanda/blob/main/colab/Amanda_Colab_Demo.ipynb)

**OR**

1. Go to https://colab.research.google.com
2. File → Open notebook → GitHub tab
3. Enter: `https://github.com/akhavansafaei/amanda`
4. Select: `colab/Amanda_Colab_Demo.ipynb`

### 2. Get Required Credentials

Before running the notebook, get these:

**ngrok Auth Token** (Free)
- Sign up at https://ngrok.com
- Get token: https://dashboard.ngrok.com/get-started/your-authtoken

**Anthropic API Key** (Free trial credits available)
- Sign up at https://console.anthropic.com
- Create API key: https://console.anthropic.com/settings/keys

### 3. Run the Notebook

1. Run each cell in order (click ▶️ or press Shift+Enter)
2. When prompted, enter your ngrok token and API key
3. Wait for all services to start (~5 minutes)
4. Click the Frontend URL to access Amanda
5. Create account and start chatting!

## 📖 Documentation

For detailed instructions, see [COLAB_INSTRUCTIONS.md](./COLAB_INSTRUCTIONS.md)

## 🎯 What You Get

After running the notebook:

- ✅ **Public Frontend URL**: Share with anyone to try Amanda
- ✅ **Public Backend API**: REST API accessible via HTTPS
- ✅ **Real-time Chat**: WebSocket streaming working
- ✅ **Full Functionality**: All features working (auth, chat, history)

## ⏱️ Setup Time

- **First time**: ~10 minutes
- **Subsequent runs**: ~5 minutes
- **Session duration**: Up to 12 hours (Colab free tier)

## 💰 Cost

**$0** - Everything is free:
- Google Colab (free tier)
- ngrok (free tier, 2 hour tunnels)
- Anthropic (free trial credits)

## 🎓 Perfect For

- ✅ Demos to professors
- ✅ Quick prototyping
- ✅ Testing before VPS deployment
- ✅ Sharing with team members
- ✅ Learning and experimentation

## ⚠️ Limitations

- 🔸 ngrok URLs change every session
- 🔸 Free ngrok tunnels expire after 2 hours
- 🔸 Colab sessions timeout after inactivity
- 🔸 Temporary storage (data lost when session ends)
- 🔸 Public URLs (anyone with link can access)

**For production**, deploy to VPS/AWS with proper database and HTTPS.

## 🔧 Troubleshooting

### Notebook won't run?
- Make sure you're using Google Chrome or Firefox
- Check that cookies are enabled
- Try incognito/private mode

### Services not starting?
- Wait 10-15 seconds between steps
- Check that you entered valid API keys
- Re-run the service start cell

### Can't access URLs?
- Click "Visit Site" if you see ngrok warning page
- Try opening in incognito mode
- Check that both services are running

### Need more help?
See detailed troubleshooting in [COLAB_INSTRUCTIONS.md](./COLAB_INSTRUCTIONS.md)

## 📚 Resources

- **Full Instructions**: [COLAB_INSTRUCTIONS.md](./COLAB_INSTRUCTIONS.md)
- **Backend Docs**: [../services/backend/README.md](../services/backend/README.md)
- **Frontend Docs**: [../services/frontend/README.md](../services/frontend/README.md)
- **Main README**: [../README.md](../README.md)

## 🎉 Next Steps

After your demo:

1. **Deploy to VPS**: Set up on DigitalOcean, AWS, or Linode
2. **Add Features**: Extend with voice, files, analytics
3. **Build Android App**: Follow the Android development guide
4. **Customize UI**: Change colors, layout, branding

## 📞 Support

- Open an issue on GitHub
- Check the troubleshooting guide
- Review service logs in Colab

---

**Ready to demo Amanda?** Open the notebook and follow the instructions! 🚀
