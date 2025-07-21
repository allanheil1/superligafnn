/**
 * Categorias de ligas disponíveis.
 */
export enum LeagueCategory {
  Bronze = "bronze",
  Cobre = "cobre",
  Prata = "prata",
  Ouro = "ouro",
  Creators = "creators",
}

/**
 * Informação de uma liga: ID e nome.
 */
export interface LeagueInfo {
  id: string;
  name: string;
}

// Liga Bronze (#9 a #59, exceto #58)
const bronzeLeagues: Record<number, LeagueInfo> = {
  // 88: { id: "1137108078496829440", name: "Liga Bronze #88" },
  // 87: { id: "1137094205949952000", name: "Liga Bronze #87" },
  // 86: { id: "1137091318041276416", name: "Liga Bronze #86" },
  // 85: { id: "1136887869747986432", name: "Liga Bronze #85" },
  // 84: { id: "1136839487687987200", name: "Liga Bronze #84" },
  // 83: { id: "1136834977070534656", name: "Liga Bronze #83" },
  // 82: { id: "1136777520541569024", name: "Liga Bronze #82" },
  // 81: { id: "1136774381264449536", name: "Liga Bronze #81" },
  // 80: { id: "1136749513223458816", name: "Liga Bronze #80" },
  // 79: { id: "1136723115578503168", name: "Liga Bronze #79" },
  // 78: { id: "1136489593337495552", name: "Liga Bronze #78" },
  // 77: { id: "1136484565981671424", name: "Liga Bronze #77" },
  // 76: { id: "1136434551879888896", name: "Liga Bronze #76" },
  // 75: { id: "1136358406073266176", name: "Liga Bronze #75" },
  // 74: { id: "1136127794209869824", name: "Liga Bronze #74" },
  // 73: { id: "1136033570352484352", name: "Liga Bronze #73" },
  // 72: { id: "1135694895169089536", name: "Liga Bronze #72" },
  // 71: { id: "1135381400481685504", name: "Liga Bronze #71" },
  // 70: { id: "1135363829610987520", name: "Liga Bronze #70" },
  // 69: { id: "1135664656665903104", name: "Liga Bronze #69" },
  // 68: { id: "1135283048834146304", name: "Liga Bronze #68" },
  // 67: { id: "1135283006194855936", name: "Liga Bronze #67" },
  // 66: { id: "1135000543942004736", name: "Liga Bronze #66" },
  // 65: { id: "1134624441331298304", name: "Liga Bronze #65" },
  // 64: { id: "1134624308543860736", name: "Liga Bronze #64" },
  // 63: { id: "1134624239866273792", name: "Liga Bronze #63" },
  // 62: { id: "1133458987682332672", name: "Liga Bronze #62" },
  // 61: { id: "1133458932518883328", name: "Liga Bronze #61" },
  // 60: { id: "1133458853661663232", name: "Liga Bronze #60" },
  // 59: { id: "1133458804991053824", name: "Liga Bronze #59" },
  // 44: { id: "1130964145525936128", name: "Liga Bronze #44" },
  // 43: { id: "1130964083509088256", name: "Liga Bronze #43" },
  // 42: { id: "1130964034389479424", name: "Liga Bronze #42" },
  // 41: { id: "1130963991657996288", name: "Liga Bronze #41" },
  // 40: { id: "1130963905045585920", name: "Liga Bronze #40" },
  // 39: { id: "1130963854198046720", name: "Liga Bronze #39" },
  // 38: { id: "1130963805225304064", name: "Liga Bronze #38" },
  // 37: { id: "1130963536072679424", name: "Liga Bronze #37" },
  // 36: { id: "1130243081577680896", name: "Liga Bronze #36" },
  // 35: { id: "1130243044588216320", name: "Liga Bronze #35" },
  // 34: { id: "1130243006885498880", name: "Liga Bronze #34" },
  // 33: { id: "1130242958311153664", name: "Liga Bronze #33" },
  // 32: { id: "1130242907983867904", name: "Liga Bronze #32" },
  // 31: { id: "1130242862945308672", name: "Liga Bronze #31" },
  // 30: { id: "1130242792942526464", name: "Liga Bronze #30" },
  // 29: { id: "1130242756154327040", name: "Liga Bronze #29" },
  // 28: { id: "1130242718959058944", name: "Liga Bronze #28" },
  // 27: { id: "1130242349269086208", name: "Liga Bronze #27" },
  // 26: { id: "1130242312245788672", name: "Liga Bronze #26" },
  // 25: { id: "1130242210869403648", name: "Liga Bronze #25" },
  // 24: { id: "1130242154464550912", name: "Liga Bronze #24" },
  // 23: { id: "1130242116506173440", name: "Liga Bronze #23" },
  // 22: { id: "1130242054690516992", name: "Liga Bronze #22" },
  // 21: { id: "1130242015498829824", name: "Liga Bronze #21" },
  // 20: { id: "1130241964508725248", name: "Liga Bronze #20" },
  // 19: { id: "1130241918073626624", name: "Liga Bronze #19" },
  // 18: { id: "1130241878877806592", name: "Liga Bronze #18" },
  // 17: { id: "1130241456628768768", name: "Liga Bronze #17" },
  // 16: { id: "1130241406167031808", name: "Liga Bronze #16" },
  // 15: { id: "1130241188700868608", name: "Liga Bronze #15" },
  // 14: { id: "1130241146602668032", name: "Liga Bronze #14" },
  // 13: { id: "1130241090982051840", name: "Liga Bronze #13" },
  // 12: { id: "1130241044764839936", name: "Liga Bronze #12" },
  // 11: { id: "1130240997797085184", name: "Liga Bronze #11" },
  // 10: { id: "1130240515917770752", name: "Liga Bronze #10" },
  // 9: { id: "1130240203106525184", name: "Liga Bronze #9" },
};

// Liga Cobre (#45 a #55)
const cobreLeagues: Record<number, LeagueInfo> = {
  // 55: { id: "1130965595383517184", name: "Liga Cobre #55" },
  // 54: { id: "1130965539440070656", name: "Liga Cobre #54" },
  // 53: { id: "1130965394388299776", name: "Liga Cobre #53" },
  // 52: { id: "1130965336045682688", name: "Liga Cobre #52" },
  // 51: { id: "1130965136296103936", name: "Liga Cobre #51" },
  // 50: { id: "1130965086929195008", name: "Liga Cobre #50" },
  // 49: { id: "1130965048526110720", name: "Liga Cobre #49" },
  // 48: { id: "1130965000811720704", name: "Liga Cobre #48" },
  // 47: { id: "1130964953583771648", name: "Liga Cobre #47" },
  // 46: { id: "1130964905189937152", name: "Liga Cobre #46" },
  // 45: { id: "1130964859895771136", name: "Liga Cobre #45" },
};

// Liga Prata (#58, #2 a #8)
const prataLeagues: Record<number, LeagueInfo> = {
  58: { id: "1133458711982469120", name: "Liga Prata #58" },
  8: { id: "1130239772808798208", name: "Liga Prata #8" },
  7: { id: "1130239579430412288", name: "Liga Prata #7" },
  6: { id: "1130239270708510720", name: "Liga Prata #6" },
  5: { id: "1130238606582366208", name: "Liga Prata #5" },
  4: { id: "1130238258962817024", name: "Liga Prata #4" },
  3: { id: "1130237883295805440", name: "Liga Prata #3" },
  2: { id: "1130237586657869824", name: "Liga Prata #2" },
};

// Liga Ouro (#1)
const ouroLeagues: Record<number, LeagueInfo> = {
  1: { id: "1130232274991058944", name: "Liga Ouro #1" },
};

// Liga dos Creators (única)
const creatorsLeague: LeagueInfo = {
  id: "1130236947248578560",
  name: "Liga dos Creators ⭐",
};

/**
 * Funções de acesso rápido para cada categoria.
 * Exemplo: Ligas.prata(6).id
 */
export const Ligas = {
  bronze: (num: number): LeagueInfo => {
    const liga = bronzeLeagues[num];
    if (!liga) throw new Error(`Liga Bronze #${num} inválida`);
    return liga;
  },
  cobre: (num: number): LeagueInfo => {
    const liga = cobreLeagues[num];
    if (!liga) throw new Error(`Liga Cobre #${num} inválida`);
    return liga;
  },
  prata: (num: number): LeagueInfo => {
    const liga = prataLeagues[num];
    if (!liga) throw new Error(`Liga Prata #${num} inválida`);
    return liga;
  },
  ouro: (num: number): LeagueInfo => {
    const liga = ouroLeagues[num];
    if (!liga) throw new Error(`Liga Ouro #${num} inválida`);
    return liga;
  },
  creators: (): LeagueInfo => creatorsLeague,
};
