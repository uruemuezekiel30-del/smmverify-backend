# SMMVerify Backend

A complete backend API for the SMMVerify platform - providing SMS OTP verification and social media boosting services.

## Features

✅ **User Authentication** - Register and login with JWT tokens
✅ **SMS OTP Services** - Facebook, WhatsApp, TikTok, Instagram verification via SMSPool
✅ **Social Media Boosting** - Followers, likes, and views for multiple platforms via SMM Panel
✅ **Wallet System** - Track user balance and transactions
✅ **Order Management** - Create, track, and manage orders
✅ **Transaction History** - Complete audit trail

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **Authentication**: JWT
- **API Clients**: Axios
- **Security**: bcryptjs

## Installation

1. Clone the repository:
```bash
git clone https://github.com/uruemuezekiel30-del/smmverify-backend
cd smmverify-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your API keys:
```
SMSPOOL_API_KEY=your_smspool_key
SMM_PANEL_API_KEY=your_smm_panel_key
SMM_PANEL_URL=your_panel_url
JWT_SECRET=your_secret_key
```

5. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### OTP Services
- `POST /api/otp/request` - Request OTP number
- `GET /api/otp/check/:orderId` - Check OTP status
- `POST /api/otp/cancel/:orderId` - Cancel OTP order

### Boosting Services
- `POST /api/boosting/order` - Place boosting order
- `GET /api/boosting/status/:orderId` - Check order status
- `GET /api/boosting/orders` - Get all user boosting orders

### User Profile
- `GET /api/user/profile` - Get user profile
- `GET /api/user/balance` - Get account balance
- `GET /api/user/transactions` - Get transaction history
- `GET /api/user/otp-history` - Get OTP order history

## Request Examples

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "john", "email": "john@example.com", "password": "pass123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "password": "pass123"}'
```

### Request OTP
```bash
curl -X POST http://localhost:3000/api/otp/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"service": "facebook", "country": "us"}'
```

### Place Boosting Order
```bash
curl -X POST http://localhost:3000/api/boosting/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"serviceType": "ig_followers", "targetLink": "https://instagram.com/username", "quantity": 1000}'
```

## Frontend Integration

Update your frontend to call these endpoints:

```javascript
// Example: Request OTP
async function requestOTP(service, country) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/otp/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ service, country })
  });
  return response.json();
}

// Example: Submit Boosting Order
async function submitBoostOrder(serviceType, targetLink, quantity) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/boosting/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ serviceType, targetLink, quantity })
  });
  return response.json();
}
```

## Deployment

### Heroku
```bash
heroku create your-app-name
heroku config:set SMSPOOL_API_KEY=your_key
heroku config:set SMM_PANEL_API_KEY=your_key
git push heroku main
```

### Environment Variables (Production)
- Set all `.env` variables in your hosting platform
- Ensure `NODE_ENV=production`
- Use a strong `JWT_SECRET`

## Database Schema

The SQLite database includes tables for:
- `users` - User accounts and balance
- `otp_orders` - OTP verification requests
- `boosting_orders` - Social media boosting orders
- `transactions` - Financial transaction history

## Error Handling

All endpoints return JSON responses with:
- `success` - Boolean indicating success/failure
- `message` - Descriptive message
- `data` - Response data (if applicable)

## Support

For API issues or questions about integration, please check:
- SMSPool API: https://smspool.net/
- Your SMM Panel documentation

## License

MIT
