const express = require('express');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

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
  const otp = req.body.otp;

  // Verifica il token OTP fornito dall'utente
  const verified = speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token: otp,
    window: 1, // Numero di finestre temporali per consentire la validazione
  });

  if (verified) {
    // Il token OTP fornito dall'utente è valido
    res.send('Token OTP corretto. Accesso consentito!');
  } else {
    // Il token OTP fornito dall'utente è invalido
    res.send('Token OTP non corretto. Accesso negato!');
  }
});

app.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
