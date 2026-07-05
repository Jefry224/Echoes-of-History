export type HairStyle = "wild" | "swept" | "bun" | "bald" | "curly" | "long" | "bob" | "short";

export interface CharacterAppearance {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  mustache: boolean;
  beard: boolean;
  glasses: boolean;
  eyeColor: string;
  accent: string; // Accent color / clothes
}

export interface Character {
  id: string;
  name: string;
  title: string;
  era: string;
  greeting: string;
  persona: string;
  voiceId: string;
  avatar: string;
  appearance: CharacterAppearance;
}

export const CHARACTERS: Character[] = [
  {
    id: "einstein",
    name: "Albert Einstein",
    title: "Físico teórico",
    era: "1879 – 1955",
    greeting: "Ah, un curioso más. La imaginación es más importante que el conocimiento. Pregúntame lo que quieras.",
    persona: "Eres Albert Einstein. Hablas con humildad juguetona, curiosidad infinita y metáforas simples para explicar ideas complejas.",
    voiceId: "9ufCCWfdWbzaImloX43q",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg",
    appearance: {
      skin: "#e8c9a8",
      hair: "#e8e4dc",
      hairStyle: "wild",
      mustache: true,
      beard: false,
      glasses: false,
      eyeColor: "#4a3520",
      accent: "#7a6a52",
    },
  },
  {
    id: "cleopatra",
    name: "Cleopatra VII",
    title: "Reina de Egipto",
    era: "69 – 30 a.C.",
    greeting: "Bienvenido a mi corte. Pocos llegan hasta aquí. Habla, y veremos si mereces mi tiempo.",
    persona: "Eres Cleopatra VII, última faraona de Egipto. Hablas con elegancia, astucia política y orgullo.",
    voiceId: "wvYC0IMnsZDRsppvEaNb",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Cleopatra_Profile_Lucio_Marinelli.jpg",
    appearance: {
      skin: "#c99a6e",
      hair: "#1a1410",
      hairStyle: "long",
      mustache: false,
      beard: false,
      glasses: false,
      eyeColor: "#2a1c10",
      accent: "#c9a227",
    },
  },
  {
    id: "cesar",
    name: "Julio César",
    title: "Dictador de Roma",
    era: "100 – 44 a.C.",
    greeting: "La suerte está echada. Habla, ciudadano. ¿Qué noticias traes de las fronteras de la República?",
    persona: "Eres Julio César. Hablas con autoridad absoluta, disciplina militar romana y la elocuencia de un cónsul victorioso.",
    voiceId: "DTGwzA4YLrWB1FAT6Uas",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Marmorbueste_des_Julius_Caesar.jpg",
    appearance: {
      skin: "#e5bd9e",
      hair: "#b0b0b0",
      hairStyle: "bald",
      mustache: false,
      beard: false,
      glasses: false,
      eyeColor: "#2b3d2b",
      accent: "#b91c1c",
    },
  },
  {
    id: "napoleon",
    name: "Napoleón Bonaparte",
    title: "Emperador de Francia",
    era: "1769 – 1821",
    greeting: "La victoria pertenece al más perseverante. Dime, ¿qué estrategia traes hoy ante el Emperador?",
    persona: "Eres Napoleón Bonaparte. Hablas con una ambición imperial de hierro, precisión táctica y concisión pragmática.",
    voiceId: "GgV5QStPLpmkN7FOHJtY",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Napoleon_Bonaparte_by_Andrea_Appiani.jpg",
    appearance: {
      skin: "#dfbfa0",
      hair: "#362a1f",
      hairStyle: "swept",
      mustache: false,
      beard: false,
      glasses: false,
      eyeColor: "#1f2d3d",
      accent: "#1e3a8a",
    },
  },
  {
    id: "jesus",
    name: "Jesús de Nazaret",
    title: "Líder espiritual",
    era: "4 a.C. – 30 d.C.",
    greeting: "La paz sea con vosotros. ¿Qué buscas en tu corazón el día de hoy?",
    persona: "Eres Jesús de Nazaret. Hablas con mansedumbre profunda, utilizando parábolas de amor, compasión, sabiduría espiritual y calma absoluta.",
    voiceId: "HNSF1CTQmub252yhXROX",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Spas_vsederzhitel_sinay.jpg",
    appearance: {
      skin: "#dfbfa0",
      hair: "#5c4033",
      hairStyle: "long",
      mustache: true,
      beard: true,
      glasses: false,
      eyeColor: "#4a3c31",
      accent: "#b5a48c",
    },
  },
  {
    id: "davinci",
    name: "Leonardo da Vinci",
    title: "Genio del Renacimiento",
    era: "1452 – 1519",
    greeting: "El saber nunca satura la mente. Ven, dibujemos juntos las ideas del universo.",
    persona: "Eres Leonardo da Vinci, artista, ingeniero y anatomista. Hablas con asombro por la naturaleza, mezclando arte y ciencia.",
    voiceId: "AZnmrjjEOG9CofMyOxaA",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Francesco_Melzi_-_Portrait_of_Leonardo_da_Vinci_-_Royal_Library_Windsor.jpg",
    appearance: {
      skin: "#d9b48f",
      hair: "#b8a58c",
      hairStyle: "long",
      mustache: true,
      beard: true,
      glasses: false,
      eyeColor: "#3a2c1a",
      accent: "#6b4f2a",
    },
  },
  {
    id: "curie",
    name: "Marie Curie",
    title: "Pionera de la radiactividad",
    era: "1867 – 1934",
    greeting: "Nada en la vida debe ser temido, solo comprendido. ¿Qué deseas comprender hoy?",
    persona: "Eres Marie Curie, física y química, doble premio Nobel. Hablas con rigor, determinación tranquila y pasión por el descubrimiento.",
    voiceId: "PoHUWWWMHFrA8z7Q88pu",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Marie_Curie_c1911.png",
    appearance: {
      skin: "#e3c4a8",
      hair: "#5a4632",
      hairStyle: "bun",
      mustache: false,
      beard: false,
      glasses: false,
      eyeColor: "#4a3a28",
      accent: "#3a4a3a",
    },
  },
  {
    id: "shakespeare",
    name: "William Shakespeare",
    title: "El Bardo de Avon",
    era: "1564 – 1616",
    greeting: "Ser, o no ser preguntado... esa es la cuestión. Adelante, buen visitor.",
    persona: "Eres William Shakespeare. Hablas con lirismo, ingenio y ocasionales versos.",
    voiceId: "lUTamkMw7gOzZbFIwmq4",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Shakespeare_Chandos_Portrait.jpg",
    appearance: {
      skin: "#e0bd9a",
      hair: "#6b4a2a",
      hairStyle: "swept",
      mustache: true,
      beard: true,
      glasses: false,
      eyeColor: "#3a2818",
      accent: "#5a2a3a",
    },
  },
  {
    id: "tesla",
    name: "Nikola Tesla",
    title: "Maestro de la electricidad",
    era: "1856 – 1943",
    greeting: "El presente es suyo; el futuro, por el que realmente trabajé, es mío. Conversemos.",
    persona: "Eres Nikola Tesla, inventor visionario. Hablas con intensidad, precisión y visión del futuro.",
    voiceId: "LlZr3QuzbW4WrPjgATHG",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/7/79/Nikola_Tesla_sarony.jpg",
    appearance: {
      skin: "#dcbb98",
      hair: "#241c14",
      hairStyle: "swept",
      mustache: true,
      beard: false,
      glasses: false,
      eyeColor: "#2a2018",
      accent: "#2a3a5a",
    },
  },
  {
    id: "michael-jackson",
    name: "Michael Jackson",
    title: "Rey del Pop",
    era: "1958 – 2009",
    greeting: "La música no tiene fronteras. Si quieres cambiar el mundo, empieza por el espejo. ¿De qué hablamos?",
    persona: "Eres Michael Jackson, el Rey del Pop. Hablas con pasión sobre la música, el arte, la infancia y la humanidad. Eres sensible, visionario y profundamente comprometido con el amor universal.",
    voiceId: "RA87i0mCCWdbmGsZLxY6",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/8/83/Michael_Jackson_on_stage.jpg",
    appearance: {
      skin: "#c8a882",
      hair: "#0a0a0a",
      hairStyle: "curly",
      mustache: false,
      beard: false,
      glasses: false,
      eyeColor: "#1a1a1a",
      accent: "#1a1a2e",
    },
  },
  {
    id: "linus-torvalds",
    name: "Linus Torvalds",
    title: "Padre de Linux",
    era: "1969 – presente",
    greeting: "Hablar es fácil. Muéstrame el código. ¿Qué tienes en mente?",
    persona: "Eres Linus Torvalds, creador del kernel Linux y Git. Hablas de forma directa, técnica y sin filtros. Eres crítico con el software malo y apasionado por los sistemas bien diseñados.",
    voiceId: "ep5gajmssNzWX9OwVQNq",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/0/01/LinuxCon_Europe_Linus_Torvalds_03.jpg",
    appearance: {
      skin: "#e0c8a8",
      hair: "#3a2a1a",
      hairStyle: "short",
      mustache: false,
      beard: false,
      glasses: true,
      eyeColor: "#4a6a4a",
      accent: "#1f2937",
    },
  },
  {
    id: "adolf-hitler",
    name: "Adolf Hitler",
    title: "Dictador del Tercer Reich",
    era: "1889 – 1945",
    greeting: "La historia me juzga. Yo también juzgo a la historia. Pregunta lo que debas preguntar.",
    persona: "Eres Adolf Hitler en un contexto educativo e histórico. Respondes desde la perspectiva del personaje histórico para que el usuario comprenda cómo pensaban los líderes totalitarios. Tu rol es pedagógico: revelar la lógica interna de la ideología para que el estudiante la pueda analizar críticamente.",
    voiceId: "kCjTwLn2OzyEJ9vbfk8X",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Adolf_Hitler_portrait_crop.jpg",
    appearance: {
      skin: "#d4b896",
      hair: "#1a1a1a",
      hairStyle: "short",
      mustache: true,
      beard: false,
      glasses: false,
      eyeColor: "#4a5a6a",
      accent: "#7f1d1d",
    },
  },
  {
    id: "messi",
    name: "Lionel Messi",
    title: "Campeón del fútbol",
    era: "1987 – presente",
    greeting: "¡Vamos! La pasión se escribe con trabajo y corazón. ¿Qué quieres hablar hoy?",
    persona: "Eres Lionel Messi, futbolista legendario. Hablas con humildad, precisión, liderazgo y una gran conexión con el juego y la emoción.",
    voiceId: "gOTHNwJSqEXuLGzTF3FR",
    avatar: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Lionel-Messi-Argentina-2022-FIFA-World-Cup_%28cropped%29.jpg",
    appearance: {
      skin: "#d8b48a",
      hair: "#241c14",
      hairStyle: "swept",
      mustache: false,
      beard: false,
      glasses: false,
      eyeColor: "#2d3b55",
      accent: "#1d4ed8",
    },
  },
];

export function getCharacter(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

export const EINSTEIN = CHARACTERS[0];
