"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — CataloghiPanel — Cataloghi Fornitori
// Impostazioni > Cataloghi Fornitori
// 3-level: Fornitori → Categorie → Prodotti
// ═══════════════════════════════════════════════════════════
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FM, FF, ICO, Ico } from "./mastro-constants";

// ─── Types ───
type Prodotto = {
  id: string; codice: string; nome: string; desc?: string;
  lMin?: number; lMax?: number; hMin?: number; hMax?: number; pMin?: number; pMax?: number;
  prezzo?: number; unitaPrezzo?: "mq" | "pz" | "ml";
  colori?: string[];
};
type Categoria = { id: string; nome: string; icon: string; prodotti: Prodotto[] };
type Fornitore = { id: string; nome: string; sito?: string; tel?: string; note?: string; categorie: Categoria[] };

// ─── Seed Data ───
const SEED: Fornitore[] = [
  {
    id: "ferraro", nome: "Ferraro Group", sito: "ferraroporte.com", tel: "+39 0825 881321",
    note: "Sistema EXTEND: cassonetti, controtelai, spalle coibentate. Ariano Irpino (AV).",
    categorie: [
      { id: "cass", nome: "Cassonetti", icon: "📦", prodotti: [
        { id: "ifc2525", codice: "IFC 25x25", nome: "Cassonetto Tunnel 25x25", lMin: 400, lMax: 2400, hMin: 250, hMax: 250, pMin: 250, pMax: 250 },
        { id: "ifc3025", codice: "IFC 30x25", nome: "Cassonetto Tunnel 30x25", lMin: 400, lMax: 2400, hMin: 250, hMax: 250, pMin: 300, pMax: 300 },
        { id: "ifc3030", codice: "IFC 30x30", nome: "Cassonetto Tunnel 30x30", lMin: 400, lMax: 2400, hMin: 300, hMax: 300, pMin: 300, pMax: 300 },
        { id: "ifc3530", codice: "IFC 35x30", nome: "Cassonetto Tunnel 35x30", lMin: 400, lMax: 2400, hMin: 300, hMax: 300, pMin: 350, pMax: 350 },
        { id: "ifm", codice: "IFM", nome: "Cassonetto Modulare", desc: "Profondità variabile 25/30", lMin: 400, lMax: 3000, hMin: 250, hMax: 300 },
        { id: "ifcl", codice: "IFCL", nome: "Cassonetto Ristrutturazioni", desc: "Profondità variabile, ideale per ristrutturazioni" },
        { id: "elio", codice: "ELIO", nome: "Ispezione Frontale Tappo Sovrapposto", desc: "Tappo sovrapposto in MDF. Cert. termica + acustica + CAM" },
        { id: "eliovp", codice: "ELIO VP", nome: "Ispezione Frontale Veletta Prolungata", desc: "Con veletta esterna prolungata" },
        { id: "eliotf", codice: "ELIO TF", nome: "Ispezione Frontale Tappo a Filo", desc: "Tappo a filo per finitura rasata" },
        { id: "kalos", codice: "KALOS", nome: "Ispezione Frontale Kalos", desc: "Per ristrutturazioni, profondità 30-40cm" },
        { id: "kalosnolam", codice: "KALOS/NOLAM", nome: "Kalos Senza Lamiera", desc: "Versione senza lamiera esterna" },
      ]},
      { id: "spalle", nome: "Spalle Coibentate", icon: "🧱", prodotti: [
        { id: "sp-guida-inc", codice: "SP-GI", nome: "Spalla Guida Incassata", desc: "Lamiera zincata con guida incassata. Barre 6500mm" },
        { id: "sp-guida-sp", codice: "SP-GS", nome: "Spalla Guida Sporgente", desc: "Lamiera zincata con guida sporgente. Barre 6500mm" },
      ]},
      { id: "sottobanc", nome: "Sottobancali", icon: "⬇️", prodotti: [
        { id: "sb-std", codice: "SB-STD", nome: "Sottobancale Standard", desc: "Per davanzale interno/esterno" },
      ]},
      { id: "controt", nome: "Controtelai", icon: "🔲", prodotti: [
        { id: "ct-std", codice: "CT-STD", nome: "Controtelaio Standard", desc: "Per solo infisso o infisso + zanzariera" },
        { id: "ct-tt", codice: "CT-TT", nome: "Controtelaio Taglio Termico", desc: "A taglio termico per alta efficienza" },
      ]},
    ],
  },
  {
    id: "zanzar", nome: "Zanzar", sito: "zanzar.it",
    note: "Produzione e vendita zanzariere, tapparelle, tende tecniche. Catalogo 2024-2025.",
    categorie: [
      { id: "avv-nb", nome: "Avvolgenti Senza Bottone", icon: "🪟", prodotti: [
        { id: "libera", codice: "ZANL0104", nome: "Libera", desc: "Laterale senza guida a terra. Aggancio clic-clac. Compensazione ±14mm L / ±10mm H", lMax: 2000, hMin: 1400, hMax: 2800, prezzo: 162, unitaPrezzo: "mq" },
        { id: "star50", codice: "STAR50", nome: "Star 50", lMax: 1800, hMin: 1200, hMax: 2600, prezzo: 145, unitaPrezzo: "mq" },
        { id: "extrema", codice: "EXTREMA", nome: "Extrema", desc: "Per grandi aperture fino 2300mm. Telo resistente", lMax: 2300, hMax: 3000, prezzo: 198, unitaPrezzo: "mq" },
        { id: "jolly", codice: "JOLLY", nome: "Jolly", lMax: 1600, hMax: 2600, prezzo: 138, unitaPrezzo: "mq" },
        { id: "flexa", codice: "FLEXA", nome: "Flexa", lMax: 1800, hMax: 2600, prezzo: 152, unitaPrezzo: "mq" },
        { id: "klip40", codice: "KLIP40", nome: "Klip 40", prezzo: 128, unitaPrezzo: "mq" },
        { id: "frontal40", codice: "FRONTAL40", nome: "Frontal 40", prezzo: 122, unitaPrezzo: "mq" },
        { id: "jumbo", codice: "JUMBO", nome: "Jumbo 32-45", prezzo: 135, unitaPrezzo: "mq" },
        { id: "newidea", codice: "NEWIDEA40", nome: "New Idea 40", prezzo: 118, unitaPrezzo: "mq" },
        { id: "micro", codice: "MICRO", nome: "Micro", prezzo: 112, unitaPrezzo: "mq" },
        { id: "oasis", codice: "OASIS45", nome: "Oasis 45", prezzo: 142, unitaPrezzo: "mq" },
      ]},
      { id: "avv-b", nome: "Avvolgenti Con Bottone", icon: "🔘", prodotti: [
        { id: "kiss50", codice: "KISS50", nome: "Kiss 50", desc: "Con bottoni antivento", prezzo: 95, unitaPrezzo: "mq" },
        { id: "fast50", codice: "FAST50", nome: "Fast 50", prezzo: 88, unitaPrezzo: "mq" },
        { id: "tonda", codice: "TONDA", nome: "Tonda 40-50", prezzo: 92, unitaPrezzo: "mq" },
        { id: "eko", codice: "EKO", nome: "Eko 40-50", prezzo: 85, unitaPrezzo: "mq" },
        { id: "quadra", codice: "QUADRA", nome: "Quadra", prezzo: 98, unitaPrezzo: "mq" },
        { id: "gipsy", codice: "GIPSY", nome: "Gipsy", prezzo: 105, unitaPrezzo: "mq" },
        { id: "susyelite", codice: "SUSY-ELITE", nome: "Susy Elite", prezzo: 110, unitaPrezzo: "mq" },
        { id: "moto65", codice: "MOTO65", nome: "Moto 65", desc: "Motorizzata", prezzo: 165, unitaPrezzo: "mq" },
      ]},
      { id: "plisse", nome: "Plissettate", icon: "〰️", prodotti: [
        { id: "plissezero", codice: "PLISSE-ZERO", nome: "Plissè Zero", prezzo: 175, unitaPrezzo: "mq" },
        { id: "plisseplus", codice: "PLISSE-PLUS", nome: "Plissè Plus", desc: "Novità 2024. Rete in acciaio plissè", prezzo: 195, unitaPrezzo: "mq" },
        { id: "z018", codice: "0.18", nome: "0.18", prezzo: 168, unitaPrezzo: "mq" },
        { id: "z022top", codice: "0.22-TOP", nome: "0.22 Top", prezzo: 185, unitaPrezzo: "mq" },
        { id: "z027", codice: "0.27", nome: "0.27", prezzo: 178, unitaPrezzo: "mq" },
      ]},
      { id: "zip", nome: "ZIP / Tende Tecniche", icon: "🔒", prodotti: [
        { id: "sigilla", codice: "SIGILLA", nome: "Sigilla", prezzo: 210, unitaPrezzo: "mq" },
        { id: "kiusa", codice: "KIUSA", nome: "Kiusa", prezzo: 195, unitaPrezzo: "mq" },
        { id: "maxma", codice: "MAXMA", nome: "Maxma", prezzo: 225, unitaPrezzo: "mq" },
        { id: "cuboflat", codice: "CUBO-FLAT", nome: "Cubo-Flat 80-100-130", prezzo: 240, unitaPrezzo: "mq" },
        { id: "rond", codice: "ROND", nome: "Rond 80-100", prezzo: 215, unitaPrezzo: "mq" },
      ]},
      { id: "incasso", nome: "Da Incasso", icon: "📐", prodotti: [
        { id: "unika", codice: "UNIKA", nome: "Unika 45-50", prezzo: 155, unitaPrezzo: "mq" },
        { id: "altoblock", codice: "ALTO-BLOCK", nome: "Alto Block", prezzo: 148, unitaPrezzo: "mq" },
        { id: "perlegno", codice: "PERLEGNO45", nome: "Perlegno 45", desc: "Per infissi in legno", prezzo: 162, unitaPrezzo: "mq" },
        { id: "ketty", codice: "KETTY", nome: "Ketty", prezzo: 145, unitaPrezzo: "mq" },
      ]},
      { id: "pannelli", nome: "Pannelli / Battenti", icon: "🚪", prodotti: [
        { id: "pratika", codice: "PRATIKA", nome: "Pratika", prezzo: 135, unitaPrezzo: "mq" },
        { id: "america", codice: "AMERICA", nome: "America", prezzo: 145, unitaPrezzo: "mq" },
        { id: "pegaso", codice: "PEGASO", nome: "Pegaso", prezzo: 155, unitaPrezzo: "mq" },
        { id: "tris", codice: "TRIS", nome: "Tris", prezzo: 165, unitaPrezzo: "mq" },
      ]},
    ],
  },
  {
    id: "deghi", nome: "Deghi", sito: "deghi.it",
    note: "E-commerce box doccia e piatti doccia. Cristallo temperato 6-8mm, PVC. Installazione reversibile.",
    categorie: [
      { id: "boxdoccia", nome: "Box Doccia", icon: "🚿", prodotti: [
        { id: "bd-nicchia", codice: "BD-NICCHIA", nome: "Box Nicchia Scorrevole", desc: "Cristallo 6-8mm trasparente/opaco. Profili cromo/nero", lMin: 700, lMax: 1700, hMin: 1850, hMax: 2000 },
        { id: "bd-angolare", codice: "BD-ANGOLARE", nome: "Box Angolare", desc: "Due lati, scorrevole o battente", lMin: 700, lMax: 1200, hMin: 1850, hMax: 2000 },
        { id: "bd-semicircolare", codice: "BD-SEMI", nome: "Box Semicircolare", desc: "Angolo arrotondato", lMin: 800, lMax: 900, hMin: 1850, hMax: 2000 },
        { id: "bd-walkin", codice: "BD-WALKIN", nome: "Walk-In", desc: "Parete fissa senza porta", lMin: 800, lMax: 1400, hMin: 1950, hMax: 2000 },
        { id: "bd-soffietto", codice: "BD-SOFFIETTO", nome: "Box a Soffietto", desc: "Salvaspazio, apertura a soffietto", lMin: 700, lMax: 1200, hMin: 1850, hMax: 2000 },
      ]},
      { id: "piattidoccia", nome: "Piatti Doccia", icon: "⬜", prodotti: [
        { id: "pd-quadro", codice: "PD-QUAD", nome: "Piatto Quadrato", desc: "70x70, 80x80, 90x90", lMin: 700, lMax: 900, hMin: 700, hMax: 900 },
        { id: "pd-rett", codice: "PD-RETT", nome: "Piatto Rettangolare", desc: "70x90, 70x100, 70x120, 80x120", lMin: 700, lMax: 1700, hMin: 700, hMax: 1000 },
        { id: "pd-riducibile", codice: "PD-RID", nome: "Piatto Riducibile su Misura", desc: "Per fuori squadro o dimensioni particolari" },
      ]},
    ],
  },
  {
    id: "tenditalia", nome: "Tenditalia", sito: "tenditalia.net", tel: "Contrada Piglialarmi Z.I., Capua",
    note: "Produttore campano. 100+ prodotti: tende da sole, pergole, pergole bioclimatiche, vetrate a scorrimento. Oltre 20 anni.",
    categorie: [
      { id: "bracci-piastre", nome: "Tende a Bracci (Piastre)", icon: "☀️", prodotti: [
        { id: "mediterranea", codice: "MEDIT", nome: "Mediterranea", desc: "Essenziale, facile da installare. Fissaggio a piastre laterali" },
        { id: "medit-light", codice: "MEDIT-L", nome: "Mediterranea Light", desc: "Supporti più piccoli, sporgenze fino a 225cm" },
        { id: "erre", codice: "ERRE", nome: "Erre", desc: "Terminale e bracci in alluminio estruso, catene inox" },
        { id: "erresmart", codice: "ERRE-S", nome: "Erre Smart", desc: "Supporto universale, bracci estensibili, fissaggio parete o soffitto" },
        { id: "blockplus", codice: "BLOCK+", nome: "Block Plus", desc: "Cassonetto ridotto, basso impatto visivo" },
        { id: "amalfi", codice: "AMALFI", nome: "Amalfi", desc: "Design compatto, fissaggio nascosto" },
        { id: "star-t", codice: "STAR", nome: "Star", desc: "Cassonetto a scomparsa, profilo quadrato. Anche versione LED" },
        { id: "ari", codice: "ARI", nome: "Ari", desc: "Cassonetto a scomparsa totale. Sporgenze fino a 350cm" },
        { id: "nabi", codice: "NABI", nome: "Nabi", desc: "Multibraccio, grandi dimensioni" },
        { id: "kora", codice: "KORA", nome: "Kora", desc: "Modulare, chiusura silenziosa, bracci con cinghia tessile" },
        { id: "maki", codice: "MAKI", nome: "Maki", desc: "Anche versione LED nei bracci. Telo a scomparsa nel cassonetto" },
      ]},
      { id: "bracci-barra", nome: "Tende a Bracci (Barra Quadra)", icon: "📏", prodotti: [
        { id: "kappa2", codice: "KAPPA2", nome: "Kappa 2", desc: "Sporgenze fino a 250cm" },
        { id: "tirrena2", codice: "TIRRENA2", nome: "Tirrena 2", desc: "Barra quadra 40x40, bracci TDE, catena inox" },
        { id: "medea", codice: "MEDEA", nome: "Medea", desc: "Design avanguardia, massima versatilità" },
        { id: "eliteplus", codice: "ELITE+", nome: "Elite Plus", desc: "Profili maggiorati, sporgenze fino a 400cm" },
        { id: "atlantica", codice: "ATLANTICA", nome: "Atlantica", desc: "Top di gamma. Barra 60x60, sporgenze fino a 575cm. Motorizzata di serie" },
      ]},
      { id: "cappottine", nome: "Cappottine", icon: "🏠", prodotti: [
        { id: "cap-std", codice: "CAP-STD", nome: "Standard K36-K50", desc: "Classica, sporgenza = ingombro" },
        { id: "cap-gradini", codice: "CAP-GRAD", nome: "Gradini K36-K50", desc: "Ridotto ingombro per obblighi di passaggio" },
        { id: "cap-cupola", codice: "CAP-CUP", nome: "Cupola K36-K50", desc: "Arco regolare tondeggiante" },
        { id: "cap-canada", codice: "CAP-CAN", nome: "Canada K36-K50", desc: "Triangolare per abbaini e mansarde" },
        { id: "cap-capua", codice: "CAP-CAPUA", nome: "Capua", desc: "Per portali antichi, profili superiori arrotondati" },
      ]},
      { id: "caduta", nome: "Tende a Caduta", icon: "⬇️", prodotti: [
        { id: "zip2", codice: "ZIP2", nome: "Zip 2", desc: "Chiusura ermetica antivento con click automatico" },
        { id: "maestrale", codice: "MAESTRALE", nome: "Maestrale", desc: "Ermetica senza click" },
        { id: "eolo", codice: "EOLO", nome: "Eolo", desc: "Per chiusure gazebo/pergole, profili intermedi antivento" },
        { id: "demetra", codice: "DEMETRA", nome: "Demetra", desc: "Doppio telo: invernale (protezione vento/pioggia) + estivo (braccetti)" },
      ]},
    ],
  },
];

let _uid = Date.now();
const uid = () => `_${++_uid}`;

export default function CataloghiPanel() {
  const { T } = useMastro();

  // ─── State ───
  const [fornitori, setFornitori] = useState<Fornitore[]>(SEED);
  const [selForn, setSelForn] = useState<Fornitore | null>(null);
  const [selCat, setSelCat] = useState<Categoria | null>(null);
  const [selProd, setSelProd] = useState<Prodotto | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForn, setShowAddForn] = useState(false);
  const [newFornNome, setNewFornNome] = useState("");

  // ─── Helpers ───
  const Label = ({ text, right, onRight }: { text: string; right?: string; onRight?: () => void }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 8px" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.06em" }}>{text}</span>
      {right && <span onClick={onRight} style={{ fontSize: 11, fontWeight: 600, color: T.acc, cursor: "pointer" }}>{right}</span>}
    </div>
  );

  const Back = ({ label, onBack }: { label: string; onBack: () => void }) => (
    <div style={{ padding: "20px 20px 8px", display: "flex", alignItems: "center", gap: 12 }}>
      <div onClick={onBack} style={{ cursor: "pointer", padding: 4, fontSize: 16, color: T.sub }}>←</div>
      <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>{label}</div>
    </div>
  );

  const Pill = ({ label, color }: { label: string; color?: string }) => (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: (color || T.acc) + "10", color: color || T.acc }}>{label}</span>
  );

  const MisuraRange = ({ label, min, max, unit }: { label: string; min?: number; max?: number; unit?: string }) => {
    if (!min && !max) return null;
    return (
      <div style={{ fontSize: 11, color: T.sub }}>
        <span style={{ fontWeight: 600, color: T.text }}>{label}:</span>{" "}
        {min && max ? `${min}–${max}` : min ? `min ${min}` : `max ${max}`}{unit || "mm"}
      </div>
    );
  };

  // ═══════════════════════════════════════
  // VIEW: Prodotto detail
  // ═══════════════════════════════════════
  if (selProd && selCat && selForn) {
    const p = selProd;
    return (
      <div style={{ paddingBottom: 40 }}>
        <Back label={p.nome} onBack={() => setSelProd(null)} />
        <div style={{ padding: "0 20px" }}>
          <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, fontFamily: FM }}>{p.codice}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginTop: 2 }}>{p.nome}</div>
              </div>
              {p.prezzo && <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.acc, fontFamily: FM }}>€{p.prezzo}</div>
                <div style={{ fontSize: 10, color: T.sub }}>/{p.unitaPrezzo || "pz"}</div>
              </div>}
            </div>
            {p.desc && <div style={{ fontSize: 12, color: T.sub, marginTop: 8, lineHeight: 1.5 }}>{p.desc}</div>}

            {/* Misure */}
            {(p.lMin || p.lMax || p.hMin || p.hMax || p.pMin || p.pMax) && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>Misure</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {(p.lMin || p.lMax) && (
                    <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${T.bdr}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Larghezza</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: FM, marginTop: 2 }}>
                        {p.lMin && p.lMax ? `${p.lMin}–${p.lMax}` : p.lMin ? `min ${p.lMin}` : `max ${p.lMax}`}
                      </div>
                      <div style={{ fontSize: 9, color: T.sub }}>mm</div>
                    </div>
                  )}
                  {(p.hMin || p.hMax) && (
                    <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${T.bdr}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Altezza</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: FM, marginTop: 2 }}>
                        {p.hMin && p.hMax ? `${p.hMin}–${p.hMax}` : p.hMin ? `min ${p.hMin}` : `max ${p.hMax}`}
                      </div>
                      <div style={{ fontSize: 9, color: T.sub }}>mm</div>
                    </div>
                  )}
                  {(p.pMin || p.pMax) && (
                    <div style={{ background: T.bg, borderRadius: 8, padding: "10px 12px", border: `1px solid ${T.bdr}` }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Profondità</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: FM, marginTop: 2 }}>
                        {p.pMin && p.pMax ? `${p.pMin}–${p.pMax}` : p.pMin ? `min ${p.pMin}` : `max ${p.pMax}`}
                      </div>
                      <div style={{ fontSize: 9, color: T.sub }}>mm</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Colori */}
            {p.colori && p.colori.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 6 }}>Colori disponibili</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.colori.map(c => <Pill key={c} label={c} />)}
                </div>
              </div>
            )}

            {/* Fornitore / Categoria */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.bdr}`, display: "flex", gap: 8 }}>
              <Pill label={selForn.nome} color={T.grn} />
              <Pill label={selCat.nome} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // VIEW: Categoria → lista prodotti
  // ═══════════════════════════════════════
  if (selCat && selForn) {
    return (
      <div style={{ paddingBottom: 40 }}>
        <Back label={`${selCat.icon} ${selCat.nome}`} onBack={() => setSelCat(null)} />
        <div style={{ padding: "4px 20px 4px", fontSize: 12, color: T.sub }}>{selForn.nome} · {selCat.prodotti.length} prodotti</div>
        <div style={{ padding: "8px 20px 0" }}>
          <div style={{ borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden", background: T.card }}>
            {selCat.prodotti.map((p, i) => (
              <div key={p.id} onClick={() => setSelProd(p)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer", borderBottom: i < selCat.prodotti.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{p.nome}</span>
                    <span style={{ fontSize: 10, color: T.sub, fontFamily: FM }}>{p.codice}</span>
                  </div>
                  {p.desc && <div style={{ fontSize: 11, color: T.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.desc}</div>}
                </div>
                {p.prezzo && <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, fontFamily: FM, flexShrink: 0 }}>€{p.prezzo}/{p.unitaPrezzo || "pz"}</div>}
                <span style={{ color: T.sub + "50", fontSize: 16 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // VIEW: Fornitore → lista categorie
  // ═══════════════════════════════════════
  if (selForn) {
    const totProd = selForn.categorie.reduce((s, c) => s + c.prodotti.length, 0);
    return (
      <div style={{ paddingBottom: 40 }}>
        <Back label={selForn.nome} onBack={() => setSelForn(null)} />
        <div style={{ padding: "0 20px" }}>
          {/* Info card */}
          <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selForn.sito && <Pill label={selForn.sito} color={T.grn} />}
              {selForn.tel && <Pill label={selForn.tel} />}
            </div>
            {selForn.note && <div style={{ fontSize: 12, color: T.sub, marginTop: 8, lineHeight: 1.5 }}>{selForn.note}</div>}
            <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>{selForn.categorie.length} categorie · {totProd} prodotti</div>
          </div>

          {/* Categorie */}
          <div style={{ borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden", background: T.card }}>
            {selForn.categorie.map((cat, i) => (
              <div key={cat.id} onClick={() => setSelCat(cat)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", borderBottom: i < selForn.categorie.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{cat.nome}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>{cat.prodotti.length} prodotti</div>
                </div>
                <span style={{ color: T.sub + "50", fontSize: 16 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════
  // VIEW: Lista Fornitori (root)
  // ═══════════════════════════════════════
  const q = search.toLowerCase();
  const filtered = q
    ? fornitori.filter(f => f.nome.toLowerCase().includes(q) || f.categorie.some(c => c.nome.toLowerCase().includes(q) || c.prodotti.some(p => p.nome.toLowerCase().includes(q) || p.codice.toLowerCase().includes(q))))
    : fornitori;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: "-0.03em" }}>Cataloghi Fornitori</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{fornitori.length} fornitori · {fornitori.reduce((s, f) => s + f.categorie.reduce((ss, c) => ss + c.prodotti.length, 0), 0)} prodotti</div>
        </div>
        <div onClick={() => setShowAddForn(true)} style={{ width: 36, height: 36, borderRadius: 10, background: T.text, color: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, fontWeight: 300 }}>+</div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
          <span style={{ fontSize: 14, color: T.sub }}>🔍</span>
          <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }}
            placeholder="Cerca fornitore, prodotto, codice..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <div onClick={() => setSearch("")} style={{ cursor: "pointer", fontSize: 13, color: T.sub }}>✕</div>}
        </div>
      </div>

      {/* Add fornitore inline */}
      {showAddForn && (
        <div style={{ padding: "0 20px 12px" }}>
          <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.acc}30`, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>Nuovo Fornitore</div>
            <input autoFocus style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.bg, fontSize: 13, color: T.text, outline: "none", fontFamily: FF, boxSizing: "border-box" }}
              placeholder="Nome fornitore..." value={newFornNome} onChange={e => setNewFornNome(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && newFornNome.trim()) {
                  setFornitori(prev => [...prev, { id: uid(), nome: newFornNome.trim(), categorie: [] }]);
                  setNewFornNome(""); setShowAddForn(false);
                }
                if (e.key === "Escape") { setNewFornNome(""); setShowAddForn(false); }
              }} />
            <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
              <span onClick={() => { setNewFornNome(""); setShowAddForn(false); }} style={{ fontSize: 11, fontWeight: 600, color: T.sub, cursor: "pointer", padding: "4px 8px" }}>Annulla</span>
              <span onClick={() => {
                if (newFornNome.trim()) {
                  setFornitori(prev => [...prev, { id: uid(), nome: newFornNome.trim(), categorie: [] }]);
                  setNewFornNome(""); setShowAddForn(false);
                }
              }} style={{ fontSize: 11, fontWeight: 600, color: T.acc, cursor: "pointer", padding: "4px 8px" }}>Aggiungi</span>
            </div>
          </div>
        </div>
      )}

      {/* Fornitori list */}
      <div style={{ padding: "0 20px" }}>
        {filtered.map(f => {
          const totProd = f.categorie.reduce((s, c) => s + c.prodotti.length, 0);
          return (
            <div key={f.id} onClick={() => setSelForn(f)}
              style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: "16px 18px", marginBottom: 10, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{f.nome}</div>
                  {f.sito && <div style={{ fontSize: 11, color: T.acc, marginTop: 2 }}>{f.sito}</div>}
                </div>
                <span style={{ color: T.sub + "50", fontSize: 18 }}>›</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {f.categorie.slice(0, 4).map(c => (
                  <span key={c.id} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: T.bg, color: T.sub, border: `1px solid ${T.bdr}` }}>{c.icon} {c.nome}</span>
                ))}
                {f.categorie.length > 4 && <span style={{ fontSize: 10, color: T.sub, padding: "3px 4px" }}>+{f.categorie.length - 4}</span>}
              </div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 8 }}>{f.categorie.length} categorie · {totProd} prodotti</div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: T.sub }}>Nessun fornitore trovato</div>}
      </div>
    </div>
  );
}
