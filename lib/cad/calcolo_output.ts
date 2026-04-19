// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — MODULO 4: CALCOLO OUTPUT TECNICO
// Input: Infisso completo
// Output: OutputTecnico con tutti i derivati
// ═══════════════════════════════════════════════════════════════
import type { Infisso, OutputTecnico, TaglioProfilo, DistintaVoce, Cella } from "./types_cad";

// Trasmittanza Uw secondo EN 14351 (semplificata)
function calcUw(infisso: Infisso, ugMedio: number): number {
  const { larghezzaVano: L, altezzaVano: H, sistema } = infisso;
  const Ag = infisso.griglia.celle.reduce((a,c) => a + c.areaMq, 0);
  const At = (L * H) / 1_000_000;
  const Af = At - Ag;
  const psi = 0.04; // W/mK psi lineare (approssimato)
  const lg = infisso.griglia.celle.reduce((a,c) => {
    return a + 2*(c.larghezzaNetta + c.altezzaNetta)/1000;
  }, 0);
  if (At === 0) return 0;
  return Math.round(((ugMedio * Ag + sistema.ufProfilo * Af + psi * lg) / At) * 100) / 100;
}

function classeEnergetica(uw: number): OutputTecnico["classeEnergetica"] {
  if (uw <= 0.8) return "A4";
  if (uw <= 1.0) return "A3";
  if (uw <= 1.2) return "A2";
  if (uw <= 1.4) return "A1";
  if (uw <= 1.6) return "A";
  if (uw <= 2.0) return "B";
  if (uw <= 2.4) return "C";
  return "D";
}

// Calcolo ML profili per lista tagli
function calcolaTagli(infisso: Infisso): TaglioProfilo[] {
  const { larghezzaVano: L, altezzaVano: H, montanti, traversi, sistema } = infisso;
  const tagli: TaglioProfilo[] = [];
  const sp = sistema.spessoreTelaio;

  // Telaio fisso: 2 montanti verticali + 1 traverso alto + 1 basso
  tagli.push({ profiloId:"tel_vert", descrizione:"Telaio verticale", lunghezzaMm: H, quantita: 2, barraAssegnata:0, offset:0 });
  tagli.push({ profiloId:"tel_oriz", descrizione:"Telaio orizzontale", lunghezzaMm: L, quantita: 2, barraAssegnata:0, offset:0 });
  // Montanti interni
  montanti.forEach((m, i) => {
    tagli.push({ profiloId:`mont_${i}`, descrizione:`Montante interno ${i+1}`, lunghezzaMm: H - sp*2, quantita: 1, barraAssegnata:0, offset:0 });
  });
  // Traversi interni
  traversi.forEach((t, i) => {
    tagli.push({ profiloId:`trav_${i}`, descrizione:`Traverso interno ${i+1}`, lunghezzaMm: L - sp*2, quantita: 1, barraAssegnata:0, offset:0 });
  });
  // Profili anta per ogni cella non fissa
  infisso.griglia.celle.filter(c => c.tipo !== "fisso" && c.tipo !== "pannello_cieco").forEach(c => {
    const w = c.larghezzaNetta; const h = c.altezzaNetta;
    tagli.push({ profiloId:`anta_v_${c.id}`, descrizione:`Anta vert. cella ${c.id}`, lunghezzaMm: h, quantita: 2, barraAssegnata:0, offset:0 });
    tagli.push({ profiloId:`anta_o_${c.id}`, descrizione:`Anta oriz. cella ${c.id}`, lunghezzaMm: w, quantita: 2, barraAssegnata:0, offset:0 });
  });

  // Assegna barre 6m (ottimizzazione greedy)
  let barra = 1; let offset = 0;
  tagli.forEach(t => {
    for (let q = 0; q < t.quantita; q++) {
      if (offset + t.lunghezzaMm > 6000) { barra++; offset = 0; }
      t.barraAssegnata = barra; t.offset = offset;
      offset += t.lunghezzaMm + 5; // 5mm lama sega
    }
  });

  return tagli;
}

function calcolaDistinta(infisso: Infisso, tagli: TaglioProfilo[]): DistintaVoce[] {
  const distinta: DistintaVoce[] = [];
  const { sistema } = infisso;

  // Profili
  const mlTot = tagli.reduce((a,t) => a + t.lunghezzaMm * t.quantita / 1000, 0);
  distinta.push({ codice:"PROF-TEL", descrizione:`Profilo telaio ${sistema.tipo} ${sistema.serieNome}`, um:"ml", quantita: Math.round(mlTot*10)/10, costoUnit: sistema.costoMlTelaio, costoTot: Math.round(mlTot * sistema.costoMlTelaio) });

  // Vetri per cella
  infisso.griglia.celle.forEach(c => {
    if (c.riempimento === "vetro" && c.vetro) {
      distinta.push({
        codice:`VET-${c.vetro.tipo}-${c.id}`,
        descrizione:`Vetro ${c.vetro.label} cella ${c.id} (${c.larghezzaNetta}x${c.altezzaNetta}mm)`,
        um:"m2", quantita: Math.round(c.areaMq*1000)/1000,
        costoUnit: c.vetro.costoMq, costoTot: Math.round(c.areaMq * c.vetro.costoMq)
      });
    }
  });

  // Ferramenta
  infisso.griglia.celle.filter(c => c.tipo !== "fisso").forEach(c => {
    if (c.ferramenta.costoFerramenta > 0) {
      distinta.push({ codice:`FER-${c.id}`, descrizione:`Ferramenta cella ${c.id} (${c.tipo})`, um:"pz", quantita:1, costoUnit: c.ferramenta.costoFerramenta, costoTot: c.ferramenta.costoFerramenta });
    }
  });

  return distinta;
}

export function calcolaOutput(infisso: Infisso, margine = 2.4): OutputTecnico {
  const celle = infisso.griglia.celle;
  const sp = infisso.sistema.spessoreTelaio;
  const { larghezzaVano: L, altezzaVano: H, montanti, traversi, sistema } = infisso;

  const areaTotMq = (L * H) / 1_000_000;
  const areaVetroMq = celle.filter(c => c.riempimento === "vetro").reduce((a,c) => a+c.areaMq, 0);
  const areaPannelliMq = celle.filter(c => c.riempimento === "pannello").reduce((a,c) => a+c.areaMq, 0);

  const mlTelaio = (L*2 + H*2) / 1000;
  const mlAnte = celle.filter(c => c.tipo !== "fisso" && c.tipo !== "pannello_cieco")
    .reduce((a,c) => a + (c.larghezzaNetta*2 + c.altezzaNetta*2)/1000, 0);
  const mlTotale = mlTelaio + mlAnte + (montanti.length*H + traversi.length*L)/1000;

  const nBarre6m = Math.ceil(mlTotale / 6);
  const sfrido = nBarre6m > 0 ? Math.round(((nBarre6m*6 - mlTotale)/(nBarre6m*6))*1000)/10 : 0;

  const pesoVetriKg = celle.reduce((a,c) => a+(c.riempimento==="vetro"&&c.vetro?c.areaMq*c.vetro.pesoMq:0), 0);
  const pesoProfiliKg = Math.round(mlTotale * 2.7); // ~2.7 kg/ml alluminio medio
  const pesoTotaleKg = Math.round((pesoVetriKg + pesoProfiliKg)*10)/10;

  const celleConVetro = celle.filter(c => c.riempimento==="vetro" && c.vetro && c.areaMq > 0);
  const ugMedio = celleConVetro.length
    ? Math.round(celleConVetro.reduce((a,c) => a + c.vetro!.ugValore * c.areaMq, 0) / areaVetroMq * 100) / 100
    : infisso.sistema.ufProfilo;

  const uw = calcUw(infisso, ugMedio);
  const rischioBrinamento = celle.some(c => c.riempimento==="vetro" && c.vetro && c.vetro.puntoDiRugiada < -5);

  const costoVetri = Math.round(celle.reduce((a,c) => a+(c.riempimento==="vetro"&&c.vetro?c.areaMq*c.vetro.costoMq:0), 0));
  const costoProfiloTelaio = Math.round(mlTelaio * sistema.costoMlTelaio);
  const costoProfiloAnte = Math.round(mlAnte * sistema.costoMlAnte);
  const costoFerramenta = celle.reduce((a,c) => a+c.ferramenta.costoFerramenta, 0);
  const costoTotMateriali = costoVetri + costoProfiloTelaio + costoProfiloAnte + costoFerramenta;

  const listaTagli = calcolaTagli(infisso);
  const distinta = calcolaDistinta(infisso, listaTagli);

  return {
    areaTotMq: Math.round(areaTotMq*100)/100,
    areaVetroMq: Math.round(areaVetroMq*100)/100,
    areaPannelliMq: Math.round(areaPannelliMq*100)/100,
    mlTelaio: Math.round(mlTelaio*100)/100,
    mlAnte: Math.round(mlAnte*100)/100,
    mlTotale: Math.round(mlTotale*100)/100,
    nBarre6m, sfrido,
    pesoVetriKg: Math.round(pesoVetriKg*10)/10,
    pesoProfiliKg, pesoTotaleKg,
    uw, ugMedio, classeEnergetica: classeEnergetica(uw),
    rischioBrinamento,
    costoVetri, costoProfiloTelaio, costoProfiloAnte, costoFerramenta,
    costoTotMateriali,
    margine,
    prezzoVendita: Math.round(costoTotMateriali * margine),
    listaTagli, distinta
  };
}
