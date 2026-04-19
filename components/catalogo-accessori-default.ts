// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Catalogo Accessori Pre-Caricato
// Prodotti principali: Master Italy, CISA, MACO, Yale + Generici
// I prezzi sono indicativi di mercato — aggiornare con listino fornitore
// ═══════════════════════════════════════════════════════════

export interface CatalogoAccessorio {
  id: string;
  categoria: string;
  codice: string;
  nome: string;
  descrizione?: string;
  fornitore: string;
  prezzo: number;           // € indicativo — aggiornare
  unitaMisura: string;      // "pz" | "ml" | "mq" | "kit" | "coppia"
  compatibileSistemi?: string[];
  immagine?: string;
  attivo: boolean;
  sottoCategoria?: string;
}

// ═══ CATEGORIE ═══
export const CATEGORIE_ACCESSORI = [
  { id: "maniglie", nome: "Maniglie", icon: "🚪" },
  { id: "cremonesi", nome: "Cremonesi", icon: "🔩" },
  { id: "cerniere", nome: "Cerniere", icon: "📎" },
  { id: "ferramenta_ar", nome: "Ferramenta Anta-Ribalta", icon: "🔧" },
  { id: "serrature", nome: "Serrature", icon: "🔐" },
  { id: "cilindri", nome: "Cilindri", icon: "🔑" },
  { id: "chiudiporta", nome: "Chiudiporta", icon: "🚪" },
  { id: "maniglioni", nome: "Maniglioni Antipanico", icon: "🚨" },
  { id: "soglie", nome: "Soglie / Davanzali", icon: "▬" },
  { id: "guarnizioni", nome: "Guarnizioni", icon: "〰" },
  { id: "motorizzazioni", nome: "Motorizzazioni", icon: "⚡" },
  { id: "controtelai", nome: "Controtelai", icon: "🏗" },
  { id: "coprifili", nome: "Coprifili / Profili", icon: "📏" },
  { id: "varie", nome: "Varie / Minuteria", icon: "🔩" },
];

// ═══ FORNITORI ═══
export const FORNITORI = [
  { id: "master", nome: "Master Italy", colore: "#E8A020" },
  { id: "cisa", nome: "CISA", colore: "#1A5276" },
  { id: "maco", nome: "MACO / Maico", colore: "#C0392B" },
  { id: "yale", nome: "Yale", colore: "#2C3E50" },
  { id: "hoppe", nome: "Hoppe", colore: "#27AE60" },
  { id: "roto", nome: "Roto", colore: "#8E44AD" },
  { id: "generico", nome: "Generico", colore: "#7F8C8D" },
];

// ═══ CATALOGO PRE-CARICATO ═══
export const CATALOGO_DEFAULT: CatalogoAccessorio[] = [

  // ──────────────────────────────────
  // MASTER ITALY — Maniglie & Cremonesi
  // ──────────────────────────────────
  // Linea KARMA
  { id:"MI-001", categoria:"maniglie", codice:"3060", nome:"Martellina Karma DK", descrizione:"Martellina anta-ribalta, manico alluminio pressofuso, cassa zama 24mm", fornitore:"master", prezzo:18, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-002", categoria:"maniglie", codice:"3060K", nome:"Martellina Karma DK con chiave", descrizione:"Martellina con chiave, coppia rottura 50Nm", fornitore:"master", prezzo:25, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-003", categoria:"maniglie", codice:"3060R", nome:"Martellina Karma Ribassata", descrizione:"Martellina ribassata H.35mm per spazi ridotti", fornitore:"master", prezzo:20, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-004", categoria:"maniglie", codice:"3067", nome:"Doppia Maniglia Karma", descrizione:"Doppia maniglia per portafinestra, manico alluminio pressofuso", fornitore:"master", prezzo:32, unitaMisura:"coppia", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-005", categoria:"cremonesi", codice:"6065", nome:"Cremonese Karma Apertura Esterna", descrizione:"Maniglia per apertura esterna, alluminio pressofuso", fornitore:"master", prezzo:28, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-006", categoria:"cremonesi", codice:"6060", nome:"Cremonese Karma Standard", descrizione:"Cremonese standard anta-ribalta", fornitore:"master", prezzo:22, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-007", categoria:"cremonesi", codice:"6060L", nome:"Cremonese Karma Logica", descrizione:"Cremonese manovra logica ambidestra, con chiave", fornitore:"master", prezzo:35, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-008", categoria:"maniglie", codice:"3060MD", nome:"Martellina Karma Minimal Design", descrizione:"Design minimale, ingombro 22mm, 200.000 cicli testati", fornitore:"master", prezzo:22, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma Minimal" },

  // Linea Italia
  { id:"MI-010", categoria:"maniglie", codice:"3042", nome:"Martellina Semplice / Italia", descrizione:"Martellina universale tavellino", fornitore:"master", prezzo:12, unitaMisura:"pz", attivo:true, sottoCategoria:"Italia" },
  { id:"MI-011", categoria:"maniglie", codice:"3045", nome:"Martellina Italia DK", descrizione:"Martellina design classico per anta-ribalta", fornitore:"master", prezzo:14, unitaMisura:"pz", attivo:true, sottoCategoria:"Italia" },

  // Linea Comfort
  { id:"MI-020", categoria:"cremonesi", codice:"A6004", nome:"Cremonese Comfort", descrizione:"Cremonese apertura interna, zama e alluminio", fornitore:"master", prezzo:16, unitaMisura:"pz", attivo:true, sottoCategoria:"Comfort" },
  { id:"MI-021", categoria:"cremonesi", codice:"A6010", nome:"Cremonese Comfort Plus", descrizione:"Cremonese ergonomica, apertura interna migliorata", fornitore:"master", prezzo:18, unitaMisura:"pz", attivo:true, sottoCategoria:"Comfort" },
  { id:"MI-022", categoria:"cremonesi", codice:"6003E", nome:"Cremonese Master Apertura Interna", descrizione:"Cremonese base per porte e finestre alluminio", fornitore:"master", prezzo:12, unitaMisura:"pz", attivo:true, sottoCategoria:"Standard" },
  { id:"MI-023", categoria:"cremonesi", codice:"6028", nome:"Cremonese Master Apertura Esterna Persiana", descrizione:"Per persiane, fissaggio superiore", fornitore:"master", prezzo:28, unitaMisura:"pz", attivo:true, sottoCategoria:"Persiane" },

  // Maniglioni alzante scorrevole
  { id:"MI-030", categoria:"maniglie", codice:"3070Q7", nome:"Maniglione Alzante Karma Q7", descrizione:"Maniglione per alzante scorrevole, quadro 7mm", fornitore:"master", prezzo:45, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },
  { id:"MI-031", categoria:"maniglie", codice:"3070Q10", nome:"Maniglione Alzante Karma Q10", descrizione:"Maniglione per alzante scorrevole, quadro 10mm", fornitore:"master", prezzo:48, unitaMisura:"pz", attivo:true, sottoCategoria:"Karma" },

  // Cerniere Master
  { id:"MI-040", categoria:"cerniere", codice:"TR-100", nome:"Cerniera Top Rapid", descrizione:"Cerniera ad aggancio rapido per profili finestra", fornitore:"master", prezzo:8, unitaMisura:"pz", attivo:true },
  { id:"MI-041", categoria:"cerniere", codice:"TR-120", nome:"Cerniera Top Rapid Pesante", descrizione:"Per ante pesanti fino a 130kg", fornitore:"master", prezzo:12, unitaMisura:"pz", attivo:true },

  // Ferramenta scorrevole
  { id:"MI-050", categoria:"ferramenta_ar", codice:"FL-001", nome:"Fast Lock Chiusura Multipunto", descrizione:"Chiusura multipunto per scorrevoli", fornitore:"master", prezzo:35, unitaMisura:"kit", attivo:true },
  { id:"MI-051", categoria:"ferramenta_ar", codice:"SHARK", nome:"Movimentazione Shark", descrizione:"Sistema movimentazione anta, entrata 9.5mm", fornitore:"master", prezzo:22, unitaMisura:"pz", attivo:true },

  // Domotica Master
  { id:"MI-060", categoria:"motorizzazioni", codice:"APRO-01", nome:"Attuatore Apro Smart", descrizione:"Automazione finestra, controllo remoto + sensori", fornitore:"master", prezzo:180, unitaMisura:"pz", attivo:true },

  // ──────────────────────────────────
  // CISA — Serrature, Cilindri, Chiudiporta
  // ──────────────────────────────────
  // Serrature
  { id:"CI-001", categoria:"serrature", codice:"11721-60", nome:"Serratura da Infilare Cisa", descrizione:"Serratura da infilare, entrata 60mm, frontale 22mm", fornitore:"cisa", prezzo:28, unitaMisura:"pz", attivo:true },
  { id:"CI-002", categoria:"serrature", codice:"44150", nome:"Elettroserratura Cisa Elettrika", descrizione:"Elettroserratura per cancelli e portoni", fornitore:"cisa", prezzo:65, unitaMisura:"pz", attivo:true },
  { id:"CI-003", categoria:"serrature", codice:"57010", nome:"Serratura Multitop Matic", descrizione:"Serratura multipunto evoluzione Multitop Pro/Max, retrocompatibile", fornitore:"cisa", prezzo:120, unitaMisura:"pz", attivo:true },
  { id:"CI-004", categoria:"serrature", codice:"46260", nome:"Serratura Cisa per Alluminio", descrizione:"Serratura da infilare per profili alluminio e ferro", fornitore:"cisa", prezzo:35, unitaMisura:"pz", attivo:true },
  { id:"CI-005", categoria:"serrature", codice:"14020", nome:"Serratura Cisa Doppia Mappa", descrizione:"Serratura doppia mappa con Cambio Facile", fornitore:"cisa", prezzo:45, unitaMisura:"pz", attivo:true },

  // Cilindri
  { id:"CI-010", categoria:"cilindri", codice:"OA310-30", nome:"Cilindro Europeo Cisa Asix", descrizione:"Cilindro di sicurezza 30/30mm, 5 chiavi", fornitore:"cisa", prezzo:25, unitaMisura:"pz", attivo:true },
  { id:"CI-011", categoria:"cilindri", codice:"OA3S1-30", nome:"Cilindro Europeo Cisa RS5", descrizione:"Cilindro alta sicurezza RS5, anti-bumping, anti-picking", fornitore:"cisa", prezzo:55, unitaMisura:"pz", attivo:true },
  { id:"CI-012", categoria:"cilindri", codice:"OA3SO-30", nome:"Cilindro Cisa C3000S", descrizione:"Cilindro certificato, protezione anti-snap", fornitore:"cisa", prezzo:40, unitaMisura:"pz", attivo:true },

  // Chiudiporta
  { id:"CI-020", categoria:"chiudiporta", codice:"60460", nome:"Chiudiporta Cisa C1510", descrizione:"Chiudiporta aereo, forza regolabile 2-5, porta max 100kg", fornitore:"cisa", prezzo:55, unitaMisura:"pz", attivo:true },
  { id:"CI-021", categoria:"chiudiporta", codice:"60480", nome:"Chiudiporta Cisa C6010", descrizione:"Chiudiporta da incasso, design minimale", fornitore:"cisa", prezzo:85, unitaMisura:"pz", attivo:true },

  // Maniglioni antipanico
  { id:"CI-030", categoria:"maniglioni", codice:"59801", nome:"Maniglione Antipanico Cisa Alpha Push", descrizione:"Maniglione antipanico 1 punto, EN 1125, barra push", fornitore:"cisa", prezzo:180, unitaMisura:"pz", attivo:true },
  { id:"CI-031", categoria:"maniglioni", codice:"59811", nome:"Maniglione Antipanico Cisa Alpha Touch", descrizione:"Maniglione antipanico 1 punto, EN 1125, barra touch", fornitore:"cisa", prezzo:195, unitaMisura:"pz", attivo:true },
  { id:"CI-032", categoria:"maniglioni", codice:"59803", nome:"Maniglione Antipanico Cisa Alpha 3P", descrizione:"Maniglione antipanico 3 punti di chiusura", fornitore:"cisa", prezzo:280, unitaMisura:"pz", attivo:true },

  // ──────────────────────────────────
  // MACO / MAICO — Ferramenta Anta-Ribalta
  // ──────────────────────────────────
  // Multi Matic
  { id:"MA-001", categoria:"ferramenta_ar", codice:"MM-CR-AR", nome:"Cremonese Anta-Ribalta Multi Matic", descrizione:"Cremonese A-R fix per legno/alluminio/PVC", fornitore:"maco", prezzo:18, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-002", categoria:"ferramenta_ar", codice:"MM-CR-AB", nome:"Cremonese Anta-Battente Multi Matic", descrizione:"Cremonese A-B variabile per legno/alluminio/PVC", fornitore:"maco", prezzo:16, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-003", categoria:"ferramenta_ar", codice:"MM-FORB", nome:"Forbice a Ribalta Multi Matic", descrizione:"Forbice ribalta premontata su asta rulli", fornitore:"maco", prezzo:22, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-004", categoria:"ferramenta_ar", codice:"MM-ASTA-C", nome:"Asta Rulli Centrale Multi Matic", descrizione:"Asta rulli centrale con forbice premontata", fornitore:"maco", prezzo:15, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-005", categoria:"ferramenta_ar", codice:"MM-ASTA-V", nome:"Asta Rulli Variabile Multi Matic", descrizione:"Asta rulli variabile con forbice premontata", fornitore:"maco", prezzo:16, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-006", categoria:"ferramenta_ar", codice:"MM-TERM-S", nome:"Terminale Superiore Multi Matic", descrizione:"Terminale superiore per cremonese A-B", fornitore:"maco", prezzo:6, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-007", categoria:"ferramenta_ar", codice:"MM-TERM-I", nome:"Terminale Inferiore Multi Matic", descrizione:"Terminale inferiore con bilanciere per A-R", fornitore:"maco", prezzo:7, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-008", categoria:"ferramenta_ar", codice:"MM-ANG-S", nome:"Movimento Angolare Standard Multi Matic", descrizione:"Per A-R e A-B, legno/alluminio/PVC", fornitore:"maco", prezzo:5, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-009", categoria:"ferramenta_ar", codice:"MM-ANG-P", nome:"Movimento Angolare Prolungabile Multi Matic", descrizione:"Prolungabile verticalmente, con scarpetta", fornitore:"maco", prezzo:8, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-010", categoria:"ferramenta_ar", codice:"MM-ALZAANTA", nome:"Dispositivo Alza-Anta Maico", descrizione:"Alza anta e anti falsa manovra per A-R", fornitore:"maco", prezzo:10, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-011", categoria:"ferramenta_ar", codice:"MM-SCONTRO", nome:"Scontro Fungo Multi Matic", descrizione:"Scontro fungo regolabile per soglia inclinata", fornitore:"maco", prezzo:3, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-012", categoria:"ferramenta_ar", codice:"MM-CR-INV", nome:"Cremonese ad Inversione Multi Matic", descrizione:"Per doppia anta, legno/alluminio/PVC", fornitore:"maco", prezzo:20, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },
  { id:"MA-013", categoria:"ferramenta_ar", codice:"MM-180", nome:"Terminale 180° Multi Matic", descrizione:"Terminale utilizzabile come inf. o sup., monoanta", fornitore:"maco", prezzo:7, unitaMisura:"pz", attivo:true, sottoCategoria:"Multi Matic" },

  // Cerniere MACO
  { id:"MA-020", categoria:"cerniere", codice:"MC-CERN-S", nome:"Cerniera Maico Standard", descrizione:"Cerniera a vista per finestre legno/PVC", fornitore:"maco", prezzo:8, unitaMisura:"pz", attivo:true },
  { id:"MA-021", categoria:"cerniere", codice:"MC-CERN-3D", nome:"Cerniera Maico 3D Regolabile", descrizione:"Cerniera regolabile su 3 assi", fornitore:"maco", prezzo:14, unitaMisura:"pz", attivo:true },

  // Maniglie MACO
  { id:"MA-030", categoria:"maniglie", codice:"MC-HARM", nome:"Maniglia Maico Harmony", descrizione:"Martellina per finestra, design lineare", fornitore:"maco", prezzo:12, unitaMisura:"pz", attivo:true },

  // Soglie MACO
  { id:"MA-040", categoria:"soglie", codice:"MC-SOGL-AL", nome:"Soglia Maico Alluminio", descrizione:"Soglia per portoncino d'ingresso, alluminio", fornitore:"maco", prezzo:35, unitaMisura:"ml", attivo:true },

  // ──────────────────────────────────
  // YALE — Serrature & Cilindri
  // ──────────────────────────────────
  { id:"YA-001", categoria:"serrature", codice:"Y89-40", nome:"Lucchetto Yale Ottone 40mm", descrizione:"Lucchetto classico in ottone, arco acciaio", fornitore:"yale", prezzo:12, unitaMisura:"pz", attivo:true },
  { id:"YA-002", categoria:"cilindri", codice:"Y1000-30", nome:"Cilindro Europeo Yale Y1000+", descrizione:"Cilindro alta sicurezza, anti-bumping, 10 perni", fornitore:"yale", prezzo:50, unitaMisura:"pz", attivo:true },
  { id:"YA-003", categoria:"cilindri", codice:"Y2100-30", nome:"Cilindro Europeo Yale Superior", descrizione:"Cilindro top di gamma, anti-snap anti-pick", fornitore:"yale", prezzo:75, unitaMisura:"pz", attivo:true },
  { id:"YA-004", categoria:"serrature", codice:"YSL-001", nome:"Serratura Smart Yale Linus", descrizione:"Serratura smart con app, Bluetooth, compatibile Alexa/Google", fornitore:"yale", prezzo:220, unitaMisura:"pz", attivo:true },
  { id:"YA-005", categoria:"chiudiporta", codice:"Y-CP-03", nome:"Chiudiporta Yale Classe 3", descrizione:"Chiudiporta aereo porta fino a 60kg", fornitore:"yale", prezzo:35, unitaMisura:"pz", attivo:true },

  // ──────────────────────────────────
  // HOPPE — Maniglie (extra)
  // ──────────────────────────────────
  { id:"HO-001", categoria:"maniglie", codice:"HP-TOKIO", nome:"Maniglia Hoppe Tokio", descrizione:"Martellina DK design, alluminio anodizzato", fornitore:"hoppe", prezzo:15, unitaMisura:"pz", attivo:true },
  { id:"HO-002", categoria:"maniglie", codice:"HP-ATLANTA", nome:"Maniglia Hoppe Atlanta", descrizione:"Martellina DK con SecuSignal per domotica", fornitore:"hoppe", prezzo:22, unitaMisura:"pz", attivo:true },
  { id:"HO-003", categoria:"maniglie", codice:"HP-SECUST", nome:"Maniglia Hoppe Secu100", descrizione:"Martellina con chiave di sicurezza, anti-effrazione", fornitore:"hoppe", prezzo:28, unitaMisura:"pz", attivo:true },

  // ──────────────────────────────────
  // ROTO — Ferramenta (extra)
  // ──────────────────────────────────
  { id:"RO-001", categoria:"ferramenta_ar", codice:"RT-NT", nome:"Roto NT Anta-Ribalta Kit", descrizione:"Kit ferramenta A-R completo per PVC/legno", fornitore:"roto", prezzo:35, unitaMisura:"kit", attivo:true },
  { id:"RO-002", categoria:"cerniere", codice:"RT-CERN", nome:"Cerniera Roto Solid S", descrizione:"Cerniera a scomparsa regolabile 3D", fornitore:"roto", prezzo:18, unitaMisura:"pz", attivo:true },

  // ──────────────────────────────────
  // GENERICI — Materiali di consumo / posa
  // ──────────────────────────────────
  { id:"GE-001", categoria:"guarnizioni", codice:"GUAR-TPE-N", nome:"Guarnizione TPE Nera al metro", descrizione:"Guarnizione battuta TPE, profilo standard", fornitore:"generico", prezzo:1.5, unitaMisura:"ml", attivo:true },
  { id:"GE-002", categoria:"guarnizioni", codice:"GUAR-TPE-G", nome:"Guarnizione TPE Grigia al metro", descrizione:"Guarnizione TPE grigia per vetro", fornitore:"generico", prezzo:1.5, unitaMisura:"ml", attivo:true },
  { id:"GE-003", categoria:"guarnizioni", codice:"GUAR-EPDM", nome:"Guarnizione EPDM al metro", descrizione:"Guarnizione in EPDM per telaio/anta", fornitore:"generico", prezzo:2, unitaMisura:"ml", attivo:true },
  { id:"GE-004", categoria:"coprifili", codice:"COPRI-PVC-B", nome:"Coprifilo PVC Bianco 40mm", descrizione:"Coprifilo piatto PVC bianco, barra 6m", fornitore:"generico", prezzo:4, unitaMisura:"ml", attivo:true },
  { id:"GE-005", categoria:"coprifili", codice:"COPRI-ALU-B", nome:"Coprifilo Alluminio Bianco 50mm", descrizione:"Coprifilo in alluminio laccato bianco", fornitore:"generico", prezzo:8, unitaMisura:"ml", attivo:true },
  { id:"GE-006", categoria:"soglie", codice:"SOGL-AL-B", nome:"Soglia Alluminio Bianca 30mm", descrizione:"Soglia in alluminio con guarnizione, barra 6m", fornitore:"generico", prezzo:12, unitaMisura:"ml", attivo:true },
  { id:"GE-007", categoria:"soglie", codice:"DAV-MARMO", nome:"Davanzale Marmo Biancone", descrizione:"Davanzale in marmo Biancone lavorato su misura", fornitore:"generico", prezzo:45, unitaMisura:"ml", attivo:true },
  { id:"GE-008", categoria:"controtelai", codice:"CT-LEGNO", nome:"Controtelaio Legno", descrizione:"Controtelaio in legno abete impregnato", fornitore:"generico", prezzo:25, unitaMisura:"pz", attivo:true },
  { id:"GE-009", categoria:"controtelai", codice:"CT-MONO", nome:"Controtelaio Monoblocco", descrizione:"Controtelaio monoblocco isolato con cassonetto integrato", fornitore:"generico", prezzo:85, unitaMisura:"pz", attivo:true },
  { id:"GE-010", categoria:"controtelai", codice:"CT-PM", nome:"Controtelaio Pronto Muro", descrizione:"Controtelaio pronto muro in lamiera zincata", fornitore:"generico", prezzo:35, unitaMisura:"pz", attivo:true },
  { id:"GE-011", categoria:"varie", codice:"SCHIUMA-PU", nome:"Schiuma Poliuretanica 750ml", descrizione:"Schiuma monocomponente per posa serramenti", fornitore:"generico", prezzo:8, unitaMisura:"pz", attivo:true },
  { id:"GE-012", categoria:"varie", codice:"SILICONE-N", nome:"Silicone Neutro 310ml", descrizione:"Silicone neutro trasparente per sigillatura", fornitore:"generico", prezzo:6, unitaMisura:"pz", attivo:true },
  { id:"GE-013", categoria:"varie", codice:"SILICONE-AC", nome:"Silicone Acetico 310ml", descrizione:"Silicone acetico bianco per giunti", fornitore:"generico", prezzo:4, unitaMisura:"pz", attivo:true },
  { id:"GE-014", categoria:"varie", codice:"ZANCHE-SET", nome:"Set Zanche Fissaggio (10pz)", descrizione:"Zanche in acciaio zincato per fissaggio telaio", fornitore:"generico", prezzo:8, unitaMisura:"kit", attivo:true },
  { id:"GE-015", categoria:"varie", codice:"VITI-TX-100", nome:"Viti Torx 7.5x112 (100pz)", descrizione:"Viti per telaio Torx 30, acciaio zincato", fornitore:"generico", prezzo:18, unitaMisura:"kit", attivo:true },
  { id:"GE-016", categoria:"varie", codice:"TASSELLI-100", nome:"Tasselli Fischer 10x80 (100pz)", descrizione:"Tasselli ad espansione per muratura", fornitore:"generico", prezzo:22, unitaMisura:"kit", attivo:true },
  { id:"GE-017", categoria:"varie", codice:"NASTRO-VM", nome:"Nastro Espandente Autoespandente 20mm", descrizione:"Nastro BG1 per giunti, rotolo 8m", fornitore:"generico", prezzo:15, unitaMisura:"pz", attivo:true },
  { id:"GE-018", categoria:"varie", codice:"NASTRO-INT", nome:"Nastro Adesivo Interno Barriera Vapore", descrizione:"Nastro per sigillatura interna, rotolo 25m", fornitore:"generico", prezzo:25, unitaMisura:"pz", attivo:true },

  // Motorizzazioni generiche
  { id:"GE-020", categoria:"motorizzazioni", codice:"MOT-TAPP-S", nome:"Motore Tapparella Standard 20Nm", descrizione:"Motore tubolare per tapparella, max 30kg", fornitore:"generico", prezzo:65, unitaMisura:"pz", attivo:true },
  { id:"GE-021", categoria:"motorizzazioni", codice:"MOT-TAPP-R", nome:"Motore Tapparella Radio 30Nm", descrizione:"Motore tubolare con telecomando radio", fornitore:"generico", prezzo:95, unitaMisura:"pz", attivo:true },
  { id:"GE-022", categoria:"motorizzazioni", codice:"MOT-TAPP-W", nome:"Motore Tapparella WiFi 30Nm", descrizione:"Motore smart WiFi, compatibile Alexa/Google", fornitore:"generico", prezzo:120, unitaMisura:"pz", attivo:true },
  { id:"GE-023", categoria:"motorizzazioni", codice:"CENTR-4CH", nome:"Centralina 4 Canali Tapparelle", descrizione:"Centralina radio 4 canali per motori tapparelle", fornitore:"generico", prezzo:45, unitaMisura:"pz", attivo:true },
];

// ═══ HELPER: ricerca nel catalogo ═══
export const searchCatalogo = (
  catalogo: CatalogoAccessorio[],
  query: string,
  filtroCategoria?: string,
  filtroFornitore?: string,
  filtroSistema?: string
): CatalogoAccessorio[] => {
  let results = catalogo.filter(a => a.attivo);
  if (filtroCategoria) results = results.filter(a => a.categoria === filtroCategoria);
  if (filtroFornitore) results = results.filter(a => a.fornitore === filtroFornitore);
  if (filtroSistema) results = results.filter(a => !a.compatibileSistemi?.length || a.compatibileSistemi.includes(filtroSistema));
  if (query) {
    const q = query.toLowerCase();
    results = results.filter(a =>
      a.nome.toLowerCase().includes(q) ||
      a.codice.toLowerCase().includes(q) ||
      a.descrizione?.toLowerCase().includes(q) ||
      a.fornitore.toLowerCase().includes(q)
    );
  }
  return results;
};
