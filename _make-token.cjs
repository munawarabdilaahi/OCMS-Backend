const jwt = require('jsonwebtoken');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const secret = (env.match(/^JWT_SECRET\s*=\s*(.*)$/m) || [])[1];
if (!secret) { console.error('NO JWT_SECRET'); process.exit(1); }
const token = jwt.sign(
  { id: 1, email: 'admin@ocms.edu', role_id: 1, jti: require('crypto').randomUUID() },
  secret,
  { expiresIn: '15m', algorithm: 'HS256', issuer: 'ocms-api', audience: 'ocms-client' }
);
console.log(token);
