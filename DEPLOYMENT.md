# SMMVerify Backend - Deployment Guide

## 📦 Deployment Options

### Option 1: Deploy to Heroku (Easiest) ⭐

1. **Install Heroku CLI**:
   - Download from: https://devcenter.heroku.com/articles/heroku-cli

2. **Login to Heroku**:
   ```bash
   heroku login
   ```

3. **Create Heroku App**:
   ```bash
   heroku create your-app-name
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

5. **View Live App**:
   ```bash
   heroku open
   ```

✅ **Your app is now live at**: `https://your-app-name.herokuapp.com`

---

### Option 2: Deploy to Railway (Simple & Fast)

1. Go to: https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your GitHub account
5. Select this repository
6. Add environment variables:
   - `SMSPOOL_API_KEY`
   - `SMM_PANEL_API_KEY`
   - `SMM_PANEL_URL`
   - `JWT_SECRET`
7. Click Deploy

✅ **Live URL**: Railway provides free domain

---

### Option 3: Deploy to Render (Free)

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repo
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Add environment variables
7. Deploy

✅ **Live URL**: `https://your-service-name.onrender.com`

---

### Option 4: Deploy with Docker (Any Server)

1. **Build Docker Image**:
   ```bash
   docker build -t smmverify-backend .
   ```

2. **Run Container**:
   ```bash
   docker run -p 3000:3000 \
     -e SMSPOOL_API_KEY="Nx1ZL25vmigW3C3U75SbYNQ1yQSJVQ2E" \
     -e SMM_PANEL_API_KEY="d61b387b6003f6d11cc284a682b29288" \
     -e SMM_PANEL_URL="https://justanotherpanel.com/api/v2" \
     smmverify-backend
   ```

3. **Or use Docker Compose**:
   ```bash
   docker-compose up -d
   ```

---

### Option 5: Run Locally

1. **Install Node.js** from: https://nodejs.org (v16+)

2. **Clone & Setup**:
   ```bash
   git clone https://github.com/uruemuezekiel30-del/smmverify-backend
   cd smmverify-backend
   npm install
   ```

3. **Create `.env` file**:
   ```
   PORT=3000
   NODE_ENV=development
   SMSPOOL_API_KEY=Nx1ZL25vmigW3C3U75SbYNQ1yQSJVQ2E
   SMM_PANEL_API_KEY=d61b387b6003f6d11cc284a682b29288
   SMM_PANEL_URL=https://justanotherpanel.com/api/v2
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   DATABASE_PATH=./database.db
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start Server**:
   ```bash
   npm start
   ```

   Backend runs at: `http://localhost:3000`

---

## 🌍 Testing Your Deployed Backend

### Test Health Check:
```bash
curl https://your-deployed-url.com/api/health
```

Should return:
```json
{"status": "Backend is running!", "timestamp": "..."}
```

### Test Registration:
```bash
curl -X POST https://your-deployed-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
```

---

## 📱 Connect Frontend to Your Deployed Backend

Update your HTML file - replace `localhost:3000` with your deployed URL:

```javascript
const BACKEND_URL = 'https://your-deployed-url.com';

async function requestOTP(service, country) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BACKEND_URL}/api/otp/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ service, country })
  });
  const data = await response.json();
  if (data.success) {
    alert(`Phone: ${data.data.phoneNumber}`);
  } else {
    alert(`Error: ${data.message}`);
  }
}
```

---

## 🔒 Production Checklist

- [ ] Change `JWT_SECRET` to a strong random key
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (all platforms do this automatically)
- [ ] Set CORS origin to your frontend URL
- [ ] Monitor API usage
- [ ] Setup error logging

---

## 📞 Support

- **Heroku Docs**: https://devcenter.heroku.com
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Docker Docs**: https://docs.docker.com

