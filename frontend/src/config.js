// API configuration helper dynamically adapting to environment or local machine IP
const rawEnvUrl = import.meta.env.VITE_API_BASE_URL;
export const API_BASE_URL = rawEnvUrl
  ? (rawEnvUrl.startsWith('http://') || rawEnvUrl.startsWith('https://') ? rawEnvUrl : `https://${rawEnvUrl}`)
  : `http://${window.location.hostname}:5050`;

// Liste officielle des 28 Classes Méthodistes et des Organisations du Temple Bethesda
export const METHODIST_CLASSES = [
  { name: "BÉTHANIE", conductor: "ASSEKE MARC" },
  { name: "BÉTHEL", conductor: "GRAH ADJO ROSE" },
  { name: "BETHLEEM", conductor: "DEZA MADELEINE / MAMIKRE PIERRE" },
  { name: "BÉNÉDICTION", conductor: "ADOU EUPHRASIE / SEKA GERARD" },
  { name: "CANAAN", conductor: "YANDE MONIQUE" },
  { name: "CITÉ DE GRÂCES", conductor: "ESSIS MARTINE" },
  { name: "CAPERNAÜM", conductor: "AKA ANGELINE" },
  { name: "DIVINE GRÂCE", conductor: "KASSI JEANNE" },
  { name: "EDEN", conductor: "NIAVA JOCELYNE / ACHIEPO ULRICH" },
  { name: "GALILÉE", conductor: "LOGBOU ELLA / WADJO JOSEPHINE" },
  { name: "HOREB", conductor: "KOUADIO TAIKI SIMON" },
  { name: "ISRAËL", conductor: "EHOUSSOU AGATHE" },
  { name: "JÉRAKMEEL", conductor: "KRAGBE EMMANUEL" },
  { name: "IMMENSE GRÂCE", conductor: "ADJA EHUA MADELEINE" },
  { name: "JÉRICHO", conductor: "KOUAKOU AGA LEONCE / LIDJI ANATHALIE" },
  { name: "JOHN WESLEY", conductor: "MEL YOU PRUDENCE / DJOKRE ESTELLE" },
  { name: "JOURDAIN", conductor: "YEDOH JOSEPHINE / OKOU ESSIS JEANNOT / KOUASSI MOÏSE" },
  { name: "JÉHOVAH SABBAOTH", conductor: "RESP. AKRE MARTHE" },
  { name: "MAISON DE GRÂCES", conductor: "N'TAKPE ODETTE" },
  { name: "MISÉRICORDE", conductor: "BLE MOHOU PAULETTE" },
  { name: "NOUVELLE JÉRUSALEM", conductor: "ADOU MICHEL" },
  { name: "NAZARETH", conductor: "ESSOH NOMEL MATTHIEU" },
  { name: "PARADIS", conductor: "AKASSI ANGELE / MALADJO DOGBO PULCHERIE" },
  { name: "PENIEL", conductor: "KOUADIO ANDERSON" },
  { name: "SALUT PAR GRÂCE", conductor: "DJEDJE HORTENSE / KOUADIO GAITAN" },
  { name: "SCHEKINAËL", conductor: "RESP. SABLE MARIE SOLANGE" },
  { name: "SILO", conductor: "ADJE BARTHELEMY / EHOUNOU EMMA / GUEU NINA" },
  { name: "SINAÏ", conductor: "NOMEL ANNETTE / LEBI AGATHE / QUANSAH RAÏSSA" },
  { name: "UNION DES HOMMES", conductor: "PETE KALL" },
  { name: "UNION DES FEMMES", conductor: "QUANSAH RAISSA" },
  { name: "JEUNESSE", conductor: "N’KPOMAN SANDRINE" },
  { name: "ECODIM", conductor: "KPEYA JEPHTE" },
  { name: "Autre / Visiteur", conductor: "" }
];
