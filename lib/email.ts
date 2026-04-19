import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'MASTRO Suite <noreply@mastrosuite.com>'

// â”€â”€ BENVENUTO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendEmailBenvenuto(to: string, nome: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Benvenuto in MASTRO Suite',
    html: templateBenvenuto(nome),
  })
}

// â”€â”€ INVITO TEAM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendEmailInvito(to: string, nomeAzienda: string, invitante: string, link: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${invitante} ti ha invitato su MASTRO Suite`,
    html: templateInvito(nomeAzienda, invitante, link),
  })
}

// â”€â”€ RESET PASSWORD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendEmailResetPassword(to: string, link: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Reimposta la tua password â€” MASTRO Suite',
    html: templateResetPassword(link),
  })
}

// â”€â”€ PREVENTIVO INVIATO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendEmailPreventivo(to: string, nomeCliente: string, nomeAzienda: string, linkPreventivo: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Il tuo preventivo da ${nomeAzienda}`,
    html: templatePreventivo(nomeCliente, nomeAzienda, linkPreventivo),
  })
}

// â”€â”€ FASCICOLO GEOMETRA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function sendEmailFascicolo(to: string, nomeCommessa: string, linkFascicolo: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Fascicolo tecnico: ${nomeCommessa}`,
    html: templateFascicolo(nomeCommessa, linkFascicolo),
  })
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEMPLATES HTML
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MASTRO Suite</title>
</head>
<body style="margin:0;padding:0;background:#F2F1EC;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F1EC;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- HEADER -->
          <tr>
            <td style="background:#1A1A1C;padding:28px 40px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">MASTRO</span>
              <span style="font-size:22px;font-weight:400;color:#D08008;"> Suite</span>
            </td>
          </tr>
          <!-- CONTENT -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background:#F2F1EC;padding:24px 40px;border-top:1px solid #e5e5e5;">
              <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
                Hai ricevuto questa email perchÃ© sei registrato su MASTRO Suite.<br>
                Per assistenza scrivi a <a href="mailto:support@mastrosuite.com" style="color:#D08008;">support@mastrosuite.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function btnPrimary(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#D08008;color:#ffffff;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:24px;">${label}</a>`
}

function templateBenvenuto(nome: string) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A1C;">Benvenuto, ${nome}! ðŸ‘‹</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
      Il tuo account MASTRO Suite Ã¨ attivo. Hai <strong>30 giorni di prova gratuita</strong> per esplorare tutti i moduli.
    </p>
    <p style="margin:0 0 8px;font-size:15px;color:#555;line-height:1.7;">Cosa puoi fare subito:</p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#555;line-height:2;">
      <li>Crea la tua prima commessa</li>
      <li>Aggiungi i tuoi clienti</li>
      <li>Inserisci le misurazioni</li>
      <li>Genera il tuo primo preventivo</li>
    </ul>
    ${btnPrimary('https://app.mastrosuite.com/dashboard', 'Inizia subito â†’')}
  `)
}

function templateInvito(nomeAzienda: string, invitante: string, link: string) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A1C;">Sei stato invitato</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
      <strong>${invitante}</strong> ti ha invitato a unirti al team di <strong>${nomeAzienda}</strong> su MASTRO Suite.
    </p>
    <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
      Clicca il pulsante per accettare l'invito e creare il tuo account.
    </p>
    ${btnPrimary(link, 'Accetta invito â†’')}
    <p style="margin:16px 0 0;font-size:12px;color:#999;">Il link scade tra 48 ore.</p>
  `)
}

function templateResetPassword(link: string) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A1C;">Reimposta password</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
      Hai richiesto di reimpostare la password del tuo account MASTRO Suite.
    </p>
    <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
      Clicca il pulsante qui sotto per scegliere una nuova password.
    </p>
    ${btnPrimary(link, 'Reimposta password â†’')}
    <p style="margin:16px 0 0;font-size:12px;color:#999;">Se non hai richiesto il reset, ignora questa email. Il link scade tra 1 ora.</p>
  `)
}

function templatePreventivo(nomeCliente: string, nomeAzienda: string, linkPreventivo: string) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A1C;">Il tuo preventivo Ã¨ pronto</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
      Gentile ${nomeCliente},<br><br>
      <strong>${nomeAzienda}</strong> ti ha inviato un preventivo tramite MASTRO Suite.
    </p>
    <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
      Clicca il pulsante per visualizzarlo e scaricarlo in PDF.
    </p>
    ${btnPrimary(linkPreventivo, 'Visualizza preventivo â†’')}
  `)
}

function templateFascicolo(nomeCommessa: string, linkFascicolo: string) {
  return baseTemplate(`
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1A1A1C;">Fascicolo tecnico disponibile</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#555;line-height:1.7;">
      Il fascicolo tecnico per la commessa <strong>${nomeCommessa}</strong> Ã¨ stato generato ed Ã¨ disponibile per il download.
    </p>
    <p style="margin:0;font-size:15px;color:#555;line-height:1.7;">
      Il fascicolo include PDF tecnico, foglio Excel misurazioni e tutti i documenti necessari per le pratiche ENEA/AdE.
    </p>
    ${btnPrimary(linkFascicolo, 'Scarica fascicolo â†’')}
    <p style="margin:16px 0 0;font-size:12px;color:#999;">Il link Ã¨ valido per 30 giorni.</p>
  `)
}
