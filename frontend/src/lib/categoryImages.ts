const BASE = 'https://images.unsplash.com'
const PARAMS = '?auto=format&fit=crop&w=800&q=75'

// Curated Unsplash photo IDs by category keyword group
const CATEGORY_MAP: Array<[string[], string]> = [
  [['gaming', 'videojueg', 'arcade', 'gamer'],    'photo-1550745165-9bc0b252726f'],
  [['escape room', 'escapolog', 'ingenio'],         'photo-1590402494682-cd3fb53b1f70'],
  [['boliche', 'nightlife', 'nocturno'],            'photo-1566737236500-c8ac43014a67'],
  [['bar'],                                         'photo-1574096077702-d21a6e1a1b39'],
  [['café', 'cafe', 'cafetería', 'coffee'],         'photo-1501339847302-ac426a4a7cbb'],
  [['gastronom', 'restaurante', 'comida', 'feria'], 'photo-1414235077428-338989a2e8c0'],
  [['teatro'],                                      'photo-1507676184212-d03ab07a01bf'],
  [['cine', 'cinema'],                              'photo-1489599849927-2ee91cede3ba'],
  [['museo', 'historia', 'museum'],                 'photo-1566127444979-b3d2b654e3d7'],
  [['arte', 'cultura', 'cultural', 'art'],          'photo-1513364776144-60967b0f800f'],
  [['parque', 'naturaleza', 'verde', 'jardín'],     'photo-1517457373958-b7bdd4587205'],
  [['plaza', 'espacio público', 'espacio verde'],   'photo-1449824913935-59a10b8d2000'],
  [['deporte', 'fútbol', 'deportivo', 'estadio', 'club deportivo'], 'photo-1547347298-4074ad3086f0'],
  [['gimnasia', 'trampolines', 'fitness'],          'photo-1571019614242-c5c5dee9f50b'],
  [['música', 'concert', 'concierto'],              'photo-1493225457124-a3eb161ffa5f'],
  [['shopping', 'comercial', 'compras', 'paseo'],   'photo-1483985988355-763728e1935b'],
  [['turismo', 'monumento', 'arquitectura', 'histórico', 'turística'], 'photo-1558618666-fcd25c85cd64'],
  [['stand up', 'humor', 'comedia'],                'photo-1527529482837-4698179dc6ce'],
  [['entretenimiento', 'recreación', 'juego'],      'photo-1574717024653-61fd2cf4d44d'],
]

const DEFAULT_PHOTO = 'photo-1501339847302-ac426a4a7cbb'

export function getCategoryImageUrl(category: string): string {
  const lower = category.toLowerCase()
  for (const [keywords, photoId] of CATEGORY_MAP) {
    if (keywords.some(kw => lower.includes(kw))) {
      return `${BASE}/${photoId}${PARAMS}`
    }
  }
  return `${BASE}/${DEFAULT_PHOTO}${PARAMS}`
}
