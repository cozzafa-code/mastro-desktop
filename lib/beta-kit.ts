/**
 * MASTRO Beta Tester Kit
 * Script per Lidia: invia inviti ai 5 beta tester
 * Usage: node -e "require('./lib/beta-kit').invitaBeta({...})"
 */

export interface BetaTester {
  nome: string;
  email: string;
  azienda: string;
  settore: string;
}

export const BETA_EMAIL_TEMPLATE = (tester: BetaTester) => `
Oggetto: Sei tra i primi 5 a provare MASTRO in anteprima

Ciao ${tester.nome},

ho selezionato personalmente 5 aziende per testare MASTRO in anteprima assoluta.
La tua — ${tester.azienda} — è una di queste.

MASTRO è il gestionale che ho costruito avendo fatto il serramentista per 20 anni.
Non è un software generico adattato: è fatto per chi fa ${tester.settore}, punto.

Cosa ti chiedo:
- 20 minuti per fare il setup iniziale
- Usarlo per 2-3 commesse reali
- Una chiamata di 30 minuti per dirmi cosa non va

Cosa ottieni:
- 3 mesi gratis dopo il lancio (valore fino a €177)
- Il tuo feedback cambia il prodotto prima che esca
- Accesso diretto a me per qualsiasi problema

Per iniziare: https://mastro-erp.vercel.app/onboarding

Rispondi a questa email se vuoi procedere.

Fabio
---
P.S. Sono solo 5 posti. Se non vuoi procedere, dimmi pure — nessun problema.
`;

export const BETA_FOLLOWUP_3GG = (tester: BetaTester) => `
Oggetto: Come sta andando con MASTRO?

Ciao ${tester.nome},

sono passati 3 giorni dal tuo accesso a MASTRO.

Hai avuto modo di creare la prima commessa?
Ci sono cose che non funzionano o che non capisci?

Mandami un messaggio qui o chiama direttamente: [numero].

Fabio
`;

export const BETA_FEEDBACK_FORM = {
  domande: [
    { id: 'q1', domanda: 'Quanto è stato facile creare la prima commessa? (1-5)', tipo: 'scala' },
    { id: 'q2', domanda: 'Cosa hai trovato più utile?', tipo: 'testo' },
    { id: 'q3', domanda: 'Cosa manca o non funziona?', tipo: 'testo' },
    { id: 'q4', domanda: 'Lo consiglieresti a un collega? (1-10)', tipo: 'scala' },
    { id: 'q5', domanda: 'Quanto pagheresti al mese per usarlo?', tipo: 'scelta', opzioni: ['< €20', '€20-40', '€40-60', '> €60'] },
    { id: 'q6', domanda: 'Note libere o richieste specifiche:', tipo: 'testo' },
  ],
};
