const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');

// Porta Server OTP
const PORT = 8085;

// Creazione di un'app Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurazione segreta per JWT
const jwtSecret = 'il_tuo_segreto';

// Genera la chiave segreta per l'utente
const secret = speakeasy.generateSecret({ length: 20 });
const secretBase32 = secret.base32;

app.get('/', (req, res) => {
  // Genera l'URL per il codice QR
  const otpUrl = speakeasy.otpauthURL({
    secret: secretBase32,
    encoding: 'base32',
    label: 'TEST ',
    issuer: 'vmontro',
  });

  // Genera il codice QR e restituisci la pagina HTML con il codice QR
  qrcode.toDataURL(otpUrl, (err, dataUrl) => {
    if (err) {
      console.error('Errore nella generazione del codice QR:', err);
      res.send('Errore nella generazione del codice QR');
      return;
    }

    const html = `
      <html>
        <body>
          <img src="${dataUrl}" alt="Codice QR">
          <form action="/verify" method="POST">
            <input type="text" name="otp" placeholder="Inserisci il codice OTP">
            <input type="submit" value="Verifica">
          </form>
        </body>
      </html>
    `;

    res.send(html);
  });
});

app.post('/verify', (req, res) => {
  // const { token, code } = req.body;
  const otp = req.body.otp;

  // Verifica il codice OTP
  const verified = speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token: otp,
    window: 1 // Controllo del codice valido per 1 step di tempo
  });

  if (verified) {
    // Genera un JWT senza scadenza utilizzando il payload dell'utente
    const payload = { id: 0, user: 'vmontro', password: '123' };
    const authToken = jwt.sign(otp, jwtSecret);

    res.json({ authToken });
  } else {
    res.status(401).json({ error: 'Codice OTP non valido' });
  }
});

// Middleware per verificare l'autenticazione JWT
function authenticateToken(req, res, next) {
  const authToken = req.headers.authorization;
  if (authToken) {
    // Verifica l'autenticità del token JWT
    jwt.verify(authToken, jwtSecret, (err, user) => {
      if (err) {
        res.status(403).json({ error: 'Token JWT non valido' });
      } else {
        next();
      }
    });
  } else {
    res.status(401).json({ error: 'Token JWT mancante' });
  }
}

app.get('/protected-route', authenticateToken, (req, res) => {
  res.json({ message: 'Hai accesso alla rotta protetta!' });
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server OTP in ascolto su porta ${PORT}`);
});
