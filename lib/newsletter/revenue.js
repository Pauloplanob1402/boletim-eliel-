// Reexporta a função de split de receita a partir da lib do Mercado Pago,
// para poder ser importada de forma mais natural em código que fala de
// "newsletter"/"receita" e não sabe (nem precisa saber) sobre Mercado Pago.
export { calculateRevenueSplit } from '../mercadopago/client';

export const REVENUE_SPLIT_TABLE = [
  { recipient_name: 'Tiago Pavinatto', percentage: 60 },
  { recipient_name: 'Eliel Duarte', percentage: 20 },
  { recipient_name: 'Paulo Nascimento', percentage: 20 },
];
