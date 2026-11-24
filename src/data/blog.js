/*
 * The Grain Journal — Alimenture's blog.
 *
 * Posts live here as plain data so the listing, the article page and the
 * build-time prerender (scripts/prerender.js) all read the same source.
 * Body blocks: { p } paragraph · { h2 } heading · { list: [] } bullets ·
 * { quote, cite? } pull quote · { tip } highlighted note.
 *
 * Keep copy honest: no medical claims, no invented numbers.
 * To publish a post, add an entry (newest first) with a unique slug.
 * `cover` is a key into src/data/blogCovers.js (keeps this file Node-safe
 * for the prerender script).
 */

export const BLOG_CATEGORIES = ['All', 'Super grains', 'Recipes', 'Heritage', 'Mindful living', 'Gifting'];

export const BLOG_POSTS = [
  {
    slug: 'millets-101-a-beginners-guide',
    title: 'Millets 101: a beginner’s guide to India’s ancient super grains',
    excerpt: 'Ragi, thinai, kambu, varagu — what each millet is, how it tastes, and the easiest ways to bring them back to your everyday plate.',
    category: 'Super grains',
    date: '2026-11-18',
    readMins: 6,
    author: 'Team Alimenture',
    cover: 'superGrains',
    featured: true,
    body: [
      { p: 'For generations, millets were the backbone of the South Indian kitchen. Hardy, drought-tolerant and deeply nourishing, they fed families long before polished white rice became the default. Today they are making a well-deserved comeback — and you do not need to overhaul your diet to enjoy them.' },
      { h2: 'Meet the family' },
      { list: [
        'Finger millet (Ragi) — earthy and slightly nutty; naturally rich in calcium and fibre. Perfect for porridge, dosa and bakes.',
        'Foxtail millet (Thinai) — light and fluffy when cooked; a simple swap for rice in pongal or lemon rice.',
        'Pearl millet (Kambu) — robust and wholesome; the hero of the classic summer kool.',
        'Kodo millet (Varagu) — mild and versatile; works beautifully in upma and khichdi.',
        'Sorghum (Cholam) — slightly sweet; makes soft rotis and crisp snacks.',
      ] },
      { h2: 'Why they matter' },
      { p: 'Millets need far less water than paddy, grow well without heavy chemical inputs and support smallholder farmers in dry regions. Choosing them is a small act that nourishes you and the land at the same time.' },
      { quote: 'Food should nourish lives, empower communities and protect nature.', cite: 'The Alimenture belief' },
      { h2: 'Easy ways to start' },
      { list: [
        'Replace half the rice in your lunch with cooked foxtail or kodo millet.',
        'Start the morning with a warm ragi malt instead of a sugary cereal.',
        'Keep a jar of millet cookies for the 4 pm snack slump.',
      ] },
      { tip: 'Rinse millets well and soak them for 30 minutes before cooking — they cook faster and turn out lighter.' },
    ],
  },
  {
    slug: 'the-story-behind-alchemis-grainlets',
    title: 'Crafting grains into gold: the story behind Alchemi’s Grainlets',
    excerpt: 'How four clean-label cookies — Red Millets Mate, Penta Bite, Tri-Grain Gain and Classic Coclets — went from a kitchen idea to your pantry.',
    category: 'Heritage',
    date: '2026-11-10',
    readMins: 5,
    author: 'Team Alimenture',
    cover: 'grainlets',
    body: [
      { p: 'Every Alchemi’s jar starts with a simple question: can a cookie be genuinely good for you and still taste like a treat? We spent months in the kitchen finding out.' },
      { h2: 'Four recipes, one promise' },
      { list: [
        'Red Millets Mate — finger millet and red sorghum for a deep, toasty bite.',
        'Penta Bite — five millets in one cookie, studded with seeds.',
        'Tri-Grain Gain — heritage Mappillai Samba and Karunguruvai rice with millet.',
        'Classic Coclets — ragi, red sorghum and grated coconut, the everyday favourite.',
      ] },
      { h2: 'What we leave out' },
      { p: 'No preservatives, no artificial colours and no artificial flavours. The colour comes from the grain; the flavour comes from slow baking.' },
      { quote: 'We don’t add goodness to a cookie. We start with it.' },
      { p: 'Each batch is baked in small runs in Chennai and packed in airtight jars so it reaches you crisp.' },
    ],
  },
  {
    slug: 'ragi-malt-three-ways',
    title: 'Ragi malt, three ways: a cosy breakfast for busy mornings',
    excerpt: 'A classic sweet version, a savoury buttermilk twist and a chilled summer shake — all ready in under ten minutes.',
    category: 'Recipes',
    date: '2026-11-02',
    readMins: 4,
    author: 'Alimenture Kitchen',
    cover: 'featureBg',
    body: [
      { p: 'Ragi malt is the original comfort drink of Tamil homes. It is filling, gentle on the stomach and endlessly adaptable.' },
      { h2: 'The base' },
      { list: [
        '2 tbsp ragi flour or health mix',
        '1 cup water',
        'A pinch of salt',
      ] },
      { p: 'Whisk the flour into cold water until smooth, then cook on a low flame, stirring, for 4–5 minutes until it thickens and turns glossy.' },
      { h2: '1. Classic sweet' },
      { p: 'Stir in warm milk, a spoon of jaggery and a pinch of cardamom. Finish with a drizzle of raw honey once it has cooled slightly.' },
      { h2: '2. Savoury buttermilk' },
      { p: 'Let the base cool, then whisk in buttermilk, a little salt, chopped shallots and green chilli. A summer staple.' },
      { h2: '3. Chilled shake' },
      { p: 'Blend the cooled base with a banana, a few dates and cold milk. Breakfast you can drink on the way out.' },
      { tip: 'Add honey only after the malt has cooled a little — it keeps its natural flavour best that way.' },
    ],
  },
  {
    slug: 'heritage-rice-varieties-of-tamil-nadu',
    title: 'Mappillai Samba, Karuppu Kavani and the heritage rices of Tamil Nadu',
    excerpt: 'The stories, flavours and traditional uses of the rice varieties our grandparents grew — and why they are worth rediscovering.',
    category: 'Heritage',
    date: '2026-10-24',
    readMins: 7,
    author: 'Team Alimenture',
    cover: 'heritageRice',
    body: [
      { p: 'Tamil Nadu was once home to thousands of native rice varieties, each suited to its own soil, season and purpose. A handful are being lovingly revived by farmers and food makers.' },
      { h2: 'Mappillai Samba' },
      { p: 'The “bridegroom’s rice” — a red rice traditionally associated with strength and stamina. Nutty and hearty, it is wonderful in kanji and idli batter.' },
      { h2: 'Karuppu Kavani' },
      { p: 'A striking black rice once reserved for special occasions. It cooks into a deep purple and has a gentle, sweet aroma.' },
      { h2: 'Karunguruvai and Kattu Yaanam' },
      { p: 'Karunguruvai is a dark, traditional rice valued for its rich profile; Kattu Yaanam grows tall and wild-hardy with very little care.' },
      { quote: 'Every native seed carries the wisdom of the soil it grew in.', cite: 'Inspired by Nammalvar' },
      { p: 'By using these grains in our recipes, we hope to give farmers a reason to keep growing them.' },
    ],
  },
  {
    slug: 'mindful-snacking-at-work',
    title: 'Mindful snacking at work: small swaps that add up',
    excerpt: 'Beat the afternoon slump without the sugar crash — practical, realistic ideas for your desk drawer.',
    category: 'Mindful living',
    date: '2026-10-15',
    readMins: 4,
    author: 'Alimenture Kitchen',
    cover: 'cookies',
    body: [
      { p: 'Most of us snack at work not because we are hungry, but because we are tired, bored or stuck. A little planning turns that habit into a nourishing one.' },
      { h2: 'Build a better desk drawer' },
      { list: [
        'A jar of millet cookies instead of cream biscuits.',
        'Roasted chana or peanuts in small portions.',
        'A flask of buttermilk or herbal tea.',
      ] },
      { h2: 'Eat with attention' },
      { p: 'Step away from the screen for five minutes. Notice the texture and taste. You will feel more satisfied with less.' },
      { tip: 'Pre-portion snacks into small boxes on Sunday so the week takes care of itself.' },
    ],
  },
  {
    slug: 'thoughtful-festive-gifting-guide',
    title: 'The thoughtful gifting guide: wholesome hampers for every occasion',
    excerpt: 'From Diwali and Pongal to corporate thank-yous — how to choose a gift that feels personal and does some good.',
    category: 'Gifting',
    date: '2026-10-05',
    readMins: 5,
    author: 'Team Alimenture',
    cover: 'munnar',
    body: [
      { p: 'The best gifts say “I thought about you.” A hamper of honest, heritage food does exactly that — and it gets eaten, not stored away.' },
      { h2: 'Match the hamper to the moment' },
      { list: [
        'Festivals — a generous mix of cookies, honey and jaggery for the whole family.',
        'Thank-yous — a compact box that fits on a desk.',
        'New parents and elders — health mixes and gentle, wholesome treats.',
        'Teams and clients — consistent, branded boxes ordered in bulk.',
      ] },
      { h2: 'Add the personal touch' },
      { p: 'A handwritten note goes a long way. All our hampers can carry a personalised message card at no extra cost.' },
      { quote: 'A gift of good food is a gift of good health.' },
      { p: 'Explore our curated hampers or ask us to build one around your budget.' },
    ],
  },
  {
    slug: 'nammalvar-and-natural-farming',
    title: 'Lessons from Nammalvar: why natural farming shapes what we make',
    excerpt: 'The ideas of Tamil Nadu’s beloved natural-farming pioneer, and how they guide the way we source our grains.',
    category: 'Mindful living',
    date: '2026-09-26',
    readMins: 6,
    author: 'Team Alimenture',
    cover: 'nammalvar',
    body: [
      { p: 'G. Nammalvar spent his life encouraging farmers to work with nature rather than against it — rebuilding soil, saving native seeds and moving away from chemical dependence.' },
      { h2: 'What we carry forward' },
      { list: [
        'Respect for native seeds and traditional varieties.',
        'Sourcing that supports farming communities fairly.',
        'Keeping ingredients close to how nature made them.',
      ] },
      { quote: 'Healthy soil, healthy food, healthy people.', cite: 'A principle we live by' },
      { p: 'Our 3S philosophy — Sustenance, Sustainability and Self-reliance — is our small way of keeping that legacy alive.' },
    ],
  },
];

export const getPost = (slug) => BLOG_POSTS.find((p) => p.slug === slug) || null;

export const formatPostDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
