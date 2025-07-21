// Regras inalteradas
const tierRules: { min: number; max: number; win: number; loss: number }[] = [
  { min: 0, max: 999, win: 200, loss: -25 }, // Chumbo
  { min: 1000, max: 1999, win: 120, loss: -50 }, // Cobre
  { min: 2000, max: 2899, win: 120, loss: -100 }, // Bronze
  { min: 2900, max: 3999, win: 100, loss: -100 }, // Prata
  { min: 4000, max: 5599, win: 80, loss: -100 }, // Ouro
  { min: 5600, max: 6000, win: 80, loss: -120 }, // Platina
  { min: 6001, max: 6499, win: 60, loss: -120 }, // Diamante
  { min: 6500, max: 6999, win: 60, loss: -140 }, // Esmeralda
  { min: 7000, max: Infinity, win: 50, loss: -200 }, // Esmeralda Real
];

export function getSlpChange(currentSlp: number, result: "W" | "L" | "T"): number {
  if (result === "T") return 0;

  const slp = Math.max(currentSlp, 0);

  // Se não achar, usa a regra do primeiro tier
  const rule = tierRules.find((r) => slp >= r.min && slp <= r.max) || tierRules[0];

  return result === "W" ? rule.win : rule.loss;
}
