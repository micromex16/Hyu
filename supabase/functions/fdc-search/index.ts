// ════════════════════════════════════════════════════════════════════════════
// Hyu — USDA FoodData Central proxy (Supabase Edge Function, Deno)
//
// Keeps the USDA API key server-side. The client never sees it. Authenticated
// users call this; FDC results are normalized to Hyu's per-100g food shape so
// the client can cache them straight into the `foods` table on log.
//
// Deploy:   supabase functions deploy fdc-search
// Secret:   supabase secrets set USDA_FDC_API_KEY=your_key
//
// Request body (POST, JSON):
//   { "action": "search", "query": "chicken breast", "pageSize": 25, "dataType": [...] }
//   { "action": "detail", "fdcId": "171077" }
// ════════════════════════════════════════════════════════════════════════════

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// FDC nutrient numbers → our normalized fields.
const NUTRIENT = {
  kcal: '208',
  protein: '203',
  carb: '205',
  fat: '204',
  fiber: '291',
  sugar: '269',
  sodium: '307',
} as const;

type NormalizedFood = {
  source: 'usda';
  source_ref: string;
  name: string;
  brand: string | null;
  serving_size: number;
  serving_unit: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  carb_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number | null;
  sugar_per_100g: number | null;
  sodium_mg_per_100g: number | null;
};

// FDC nutrient arrays come in two shapes (search vs. detail). Normalize both.
function nutrientValue(food: any, number: string): number | null {
  const list: any[] = food.foodNutrients ?? [];
  for (const n of list) {
    const num = n.nutrientNumber ?? n.nutrient?.number;
    if (String(num) === number) {
      const val = n.value ?? n.amount;
      return typeof val === 'number' ? val : null;
    }
  }
  return null;
}

function normalize(food: any): NormalizedFood {
  return {
    source: 'usda',
    source_ref: String(food.fdcId),
    name: food.description ?? 'Unknown food',
    brand: food.brandOwner ?? food.brandName ?? null,
    serving_size: typeof food.servingSize === 'number' ? food.servingSize : 100,
    serving_unit: food.servingSizeUnit ?? 'g',
    kcal_per_100g: nutrientValue(food, NUTRIENT.kcal) ?? 0,
    protein_per_100g: nutrientValue(food, NUTRIENT.protein) ?? 0,
    carb_per_100g: nutrientValue(food, NUTRIENT.carb) ?? 0,
    fat_per_100g: nutrientValue(food, NUTRIENT.fat) ?? 0,
    fiber_per_100g: nutrientValue(food, NUTRIENT.fiber),
    sugar_per_100g: nutrientValue(food, NUTRIENT.sugar),
    sodium_mg_per_100g: nutrientValue(food, NUTRIENT.sodium),
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = Deno.env.get('USDA_FDC_API_KEY');
  if (!apiKey) return json({ error: 'Server is missing USDA_FDC_API_KEY' }, 500);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  try {
    if (payload.action === 'search') {
      const query = String(payload.query ?? '').trim();
      if (!query) return json({ error: 'Missing query' }, 400);

      const pageSize = Math.min(Number(payload.pageSize) || 25, 50);
      const dataType = Array.isArray(payload.dataType)
        ? payload.dataType
        : ['Foundation', 'SR Legacy', 'Branded'];

      const res = await fetch(`${FDC_BASE}/foods/search?api_key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, pageSize, dataType }),
      });
      if (!res.ok) return json({ error: `FDC error ${res.status}` }, 502);

      const data = await res.json();
      const foods = (data.foods ?? []).map(normalize);
      return json({ foods });
    }

    if (payload.action === 'detail') {
      const fdcId = String(payload.fdcId ?? '').trim();
      if (!fdcId) return json({ error: 'Missing fdcId' }, 400);

      const res = await fetch(`${FDC_BASE}/food/${encodeURIComponent(fdcId)}?api_key=${apiKey}`);
      if (!res.ok) return json({ error: `FDC error ${res.status}` }, 502);

      const food = await res.json();
      return json({ food: normalize(food) });
    }

    return json({ error: 'Unknown action; expected "search" or "detail"' }, 400);
  } catch (err) {
    return json({ error: `Proxy failure: ${(err as Error).message}` }, 500);
  }
});
