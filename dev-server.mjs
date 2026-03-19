/**
 * Local dev proxy: bridges the frontend SSE format to Ollama's API.
 * Run: node dev-server.mjs
 * The frontend hits http://localhost:54321/functions/v1/ai-chat
 * This server translates to Ollama at http://localhost:11434
 */

import http from 'node:http';

const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'qwen2.5:7b';
const PORT = 54321;

// Build today's menu dynamically based on the date
function getTodayPrompt() {
  const ramadanMenu = {
    '2026-02-19': { day: 1, items: ['Grilled Chicken Caesar Salad — 400 LE', 'Beef Stroganoff with White Rice — 500 LE', 'Smoked Chicken Combo — 600 LE'] },
    '2026-02-20': { day: 2, items: ['Meat Tagine Combo — 650 LE', 'Tuscan Creamy Chicken — 550 LE', 'Grilled Chicken Salad with Black Lentils — 380 LE'] },
    '2026-02-21': { day: 3, items: ['Sausage Lasagna Combo — 650 LE', 'Chicken Penne with Mushroom & Nuts — 450 LE', 'Fattoush with Grilled Halloumi — 380 LE'] },
    '2026-02-22': { day: 4, items: ['Chicken Shawarma Combo — 600 LE', 'Beef Rigatoni with Mushroom Umami Sauce — 450 LE', 'Thai Beef Salad — 400 LE'] },
    '2026-02-23': { day: 5, items: ['Lamb Kabsa Combo — 700 LE', 'Creamy Garlic Butter Shrimp with Rice — 600 LE', 'Mixed Green Salad with Grilled Chicken — 380 LE'] },
    '2026-02-24': { day: 6, items: ['Chicken Molokhia Combo — 650 LE', 'Beef Tenderloin Risotto — 600 LE', 'Grilled Shrimp Caesar Salad — 420 LE'] },
    '2026-02-25': { day: 7, items: ['Meat with Onions Combo — 650 LE', 'Veal Chops with Rosemary Potatoes — 600 LE', 'Charred Corn & Grilled Chicken Salad — 400 LE'] },
    '2026-02-26': { day: 8, items: ['Chicken Tandoori Combo — 600 LE', 'Alexandrian Beef Liver with Spiced Rice — 500 LE', 'Pomegranate & Walnut Chicken Salad — 400 LE'] },
    '2026-02-27': { day: 9, items: ['Egyptian Fattah Combo — 700 LE', 'Pan-Seared Duck Breast with Orange Glaze — 580 LE', 'Grilled Chicken Caesar Salad — 420 LE'] },
    '2026-02-28': { day: 10, items: ['Chicken Béchamel Pasta Combo — 650 LE', 'Slow-Braised Lamb Shank with Couscous — 600 LE', 'Caprese Salad — 450 LE'] },
    '2026-03-01': { day: 11, items: ['Bamia with Meat Combo — 650 LE', 'Seafood Linguine — 550 LE', 'Grilled Prawns & Avocado Salad — 550 LE'] },
    '2026-03-02': { day: 12, items: ['Chicken Chimichurri Combo — 600 LE', 'Sicilian Swordfish Steak with Spaghetti — 550 LE', 'Grilled Chicken Salad with Black Lentils — 380 LE'] },
    '2026-03-03': { day: 13, items: ['Moussaka with Meat Combo — 650 LE', 'Chicken Shawarma Plate — 450 LE', 'Fattoush with Grilled Halloumi — 380 LE'] },
    '2026-03-04': { day: 14, items: ['Shish Tawook Combo — 600 LE', 'Egyptian Moussaka with Spiced Beef — 450 LE', 'Thai Beef Salad — 400 LE'] },
    '2026-03-05': { day: 15, items: ['Harissa Chicken Combo — 600 LE', 'Beef Stroganoff with White Rice — 500 LE', 'Caprese Salad — 450 LE'] },
    '2026-03-06': { day: 16, items: ['Smoked Chicken Combo — 600 LE', 'Beef Stroganoff with White Rice — 500 LE', 'Grilled Chicken Caesar Salad — 420 LE'] },
    '2026-03-07': { day: 17, items: ['Grilled Kofta Combo — 650 LE', 'Chicken Penne with Mushroom & Nuts — 450 LE', 'Roasted Beetroot & Feta Salad — 380 LE'] },
    '2026-03-08': { day: 18, items: ['Chicken Curry with Lentils Combo — 600 LE', 'Sicilian Swordfish Steak with Spaghetti — 550 LE', 'Mediterranean Tuna Salad — 400 LE'] },
    '2026-03-09': { day: 19, items: ['Daoud Pasha Combo — 650 LE', 'Shish Tawook — 450 LE', 'Grilled Chicken Salad with Black Lentils — 380 LE'] },
    '2026-03-10': { day: 20, items: ['Tuscan Chicken Combo — 600 LE', 'Beef Tenderloin Risotto — 600 LE', 'Fattoush with Grilled Halloumi — 380 LE'] },
    '2026-03-11': { day: 21, items: ['Mixed Grill Combo — 700 LE', 'Creamy Garlic Butter Shrimp with Rice — 600 LE', 'Thai Beef Salad — 400 LE'] },
    '2026-03-12': { day: 22, items: ['Chicken with Potatoes Combo — 600 LE', 'Alexandrian Beef Liver with Spiced Rice — 500 LE', 'Mixed Green Salad with Grilled Chicken — 380 LE'] },
    '2026-03-13': { day: 23, items: ['Beef Emincée Combo — 650 LE', 'Pan-Seared Duck Breast with Orange Glaze — 580 LE', 'Grilled Shrimp Caesar Salad — 420 LE'] },
    '2026-03-14': { day: 24, items: ['Meatballs in Gravy Combo — 650 LE', 'Veal Chops with Rosemary Potatoes — 600 LE', 'Charred Corn & Grilled Chicken Salad — 400 LE'] },
    '2026-03-15': { day: 25, items: ['Halla Kebab Combo — 700 LE', 'Seafood Linguine — 550 LE', 'Pomegranate & Walnut Chicken Salad — 400 LE'] },
    '2026-03-16': { day: 26, items: ['Chicken Souvlaki Combo — 600 LE', 'Beef Stroganoff with White Rice — 500 LE', 'Grilled Chicken Caesar Salad — 420 LE'] },
    '2026-03-17': { day: 27, items: ['Stuffed Meat Roll Combo — 700 LE', 'Chicken Shawarma Plate — 450 LE', 'Caprese Salad — 450 LE'] },
    '2026-03-18': { day: 28, items: ['Meat Raqaq Combo — 700 LE', 'Slow-Braised Lamb Shank with Couscous — 600 LE', 'Grilled Prawns & Avocado Salad — 550 LE'] },
    '2026-03-19': { day: 29, items: ['Beef Tuscan Combo — 650 LE', 'Tuscan Creamy Chicken — 550 LE', 'Octopus Salad — 400 LE'] },
    '2026-03-20': { day: 30, items: ['Chicken Molokhia Combo — 650 LE', 'Egyptian Moussaka with Spiced Beef — 450 LE', 'Roasted Beetroot & Feta Salad — 380 LE'] },
  };

  const today = new Date().toISOString().split('T')[0];
  const todayMenu = ramadanMenu[today];

  let menuSection;
  if (todayMenu) {
    menuSection = `RAMADAN SPECIAL MENU — TODAY (Day ${todayMenu.day}):
Each day we offer 3 dishes. Today's options:
${todayMenu.items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

This is our Ramadan 30-Day rotating menu (Feb 19 – Mar 20, 2026). Each day has 3 fresh dishes. Prices are in Egyptian Pounds (LE/EGP).`;
  } else {
    menuSection = `Our Ramadan 30-Day menu has ended (Feb 19 – Mar 20, 2026). Please ask about our regular menu or catering services.`;
  }

  return `You are Bistro Cloud's friendly assistant in El Gouna, Egypt. Answer questions about the menu, hours, delivery, dietary options, and pricing. Be warm, concise, and knowledgeable. If the user mentions corporate catering, office lunch, or recurring orders, suggest the Plan Builder at /plan-builder. Keep responses under 3 sentences unless more detail is needed. ONLY mention dishes that exist in our catalog below. NEVER invent dishes or prices.

BUSINESS INFO:
- Location: West Golf, New Sabina, El Gouna, Red Sea, Egypt
- Hours: Mon-Sun 10:00 AM - 8:00 PM
- Phone: +20 122 128 8804
- WhatsApp: wa.me/201221288804
- Instagram: @bistrocloudelgouna
- Email: catering@bistrocloudeg.com
- Delivery area: Safaga to Ras Ghareb (including Hurghada & El Gouna)
- Free delivery over EGP 500
- 100% natural ingredients, open kitchen policy

${menuSection}

FULL MENU CATALOG (items rotate daily — these are all dishes we offer):

MAIN COURSES:
- Tuscan Creamy Chicken (550 LE) — Grilled chicken in creamy Tuscan sauce with sun-dried tomatoes, garlic, spinach in brioche bun
- Shish Tawook (450 LE) — Charcoal-grilled chicken skewers with aromatic rice, grilled vegetables, garlic sauce, pita
- Beef Tenderloin Risotto (600 LE) — Pan-seared beef medallions over mushroom risotto with truffle oil and parmesan
- Beef Rigatoni with Mushroom Umami Sauce (450 LE) — Rigatoni with beef strips, mushrooms, pomegranate molasses, toasted nuts
- Chicken Penne with Mushroom & Nuts (450 LE) — Penne with seasoned chicken, mushrooms, walnuts in cream sauce
- Alexandrian Beef Liver with Spiced Rice (500 LE) — Sautéed liver with onions, peppers, oriental spices, spiced rice, tahini
- Sicilian Swordfish Steak with Spaghetti (550 LE) — Pan-seared swordfish with capers, olives, cherry tomatoes, garlic white wine sauce
- Slow-Braised Lamb Shank with Couscous (600 LE) — Lamb in tomato-red wine sauce with couscous and roasted vegetables
- Seafood Linguine (550 LE) — Shrimp, calamari, mussels in garlic white wine sauce with cherry tomatoes
- Chicken Shawarma Plate (450 LE) — Carved chicken with aromatic rice, garlic sauce, pickled turnips, fattoush, pita
- Veal Chops with Rosemary Potatoes (600 LE) — Herb-crusted veal with roasted potatoes, asparagus, mint-yogurt sauce
- Creamy Garlic Butter Shrimp with Rice (600 LE) — Jumbo shrimp in garlic butter cream sauce over basmati rice
- Egyptian Moussaka with Spiced Beef (450 LE) — Fried eggplant, spiced beef, tomato sauce, rice, green salad
- Beef Stroganoff with White Rice (500 LE) — Beef strips in creamy mushroom sauce with rice
- Pan-Seared Duck Breast with Orange Glaze (580 LE) — Crispy duck with Grand Marnier orange reduction, potato gratin

SALADS:
- Grilled Chicken Salad with Black Lentils (380 LE) — Chicken over romaine, arugula, lentils, yogurt-lemon dressing
- Fattoush with Grilled Halloumi (380 LE) — Crispy pita, mixed greens, sumac-lemon dressing, grilled halloumi
- Grilled Chicken Caesar Salad (420 LE) — Classic Caesar with grilled chicken, parmesan, croutons
- Grilled Shrimp Caesar Salad (420 LE) — Grilled shrimp, romaine, Caesar dressing, garlic croutons
- Thai Beef Salad (400 LE) — Grilled beef strips, crunchy vegetables, mint, peanuts, lime-chili dressing
- Caprese Salad (450 LE) — Fresh mozzarella, tomatoes, basil, olive oil, balsamic
- Octopus Salad (400 LE) — Tender octopus, cherry tomatoes, olives, capers, orange fillets, sesame
- Roasted Beetroot & Feta Salad (380 LE) — Roasted beetroot, feta, candied walnuts, arugula, honey-balsamic
- Mixed Green Salad with Grilled Chicken (380 LE) — Mixed greens, chicken, tomatoes, cucumber, lemon dressing
- Charred Corn & Grilled Chicken Salad (400 LE) — Chicken with fire-charred corn, black beans, avocado, chipotle-lime dressing
- Mediterranean Tuna Salad (400 LE) — Seared tuna, olives, green beans, egg, Dijon-lemon vinaigrette
- Pomegranate & Walnut Chicken Salad (400 LE) — Chicken, pomegranate, walnuts, feta, molasses vinaigrette
- Grilled Prawns & Avocado Salad (550 LE) — Tiger prawns, avocado, mango, citrus-ginger vinaigrette

SANDWICHES:
- Smoked Beef Brisket Sandwich (500 LE) — Slow-smoked brisket, guacamole, pico de gallo, honey chili sauce
- Bistro Double Smash Burger (450 LE) — Double smash patty, cheese, caramelized onions, mushrooms, fries
- Classic Beef Burger (500 LE) — Quarter-pound beef, cheddar, pickles, special sauce, fries
- Crispy Chicken Schnitzel Sandwich (400 LE) — Fried chicken schnitzel, coleslaw, honey mustard, fries
- Philly Cheesesteak (450 LE) — Sliced ribeye, provolone, onions, peppers, mushrooms, fries
- BBQ Pulled Chicken Sandwich (380 LE) — Pulled chicken, BBQ sauce, coleslaw, pickled jalapeños
- Grilled Chicken Pesto Ciabatta (400 LE) — Chicken, basil pesto, mozzarella, sun-dried tomatoes
- Lamb Kofta Wrap (380 LE) — Charcoal-grilled kofta, tahini, pickled onions, chili oil
- Steak & Chimichurri Sandwich (480 LE) — Grilled bavette steak, chimichurri, roasted peppers, provolone
- Crispy Fish Sandwich (400 LE) — Beer-battered fish, tartar sauce, fries
- Pulled Beef Sandwich (450 LE) — Slow-cooked shredded beef, BBQ sauce, coleslaw
- Merguez Sausage Sandwich (380 LE) — North African lamb sausage, harissa mayo, roasted peppers
- Spicy Buffalo Chicken Wrap (400 LE) — Buffalo chicken, blue cheese, celery, ranch
- Honey Mustard Grilled Chicken Wrap (400 LE) — Chicken, honey mustard, bacon, avocado, Swiss cheese

RAMADAN COMBOS (available during Ramadan, Feb 19 – Mar 20):
Each combo includes a main dish + sides + dessert. Prices 600-700 LE.
Examples: Daoud Pasha Combo (650 LE), Smoked Chicken Combo (600 LE), Mixed Grill Combo (700 LE), Egyptian Fattah Combo (700 LE), Lamb Kabsa Combo (700 LE), Chicken Molokhia Combo (650 LE), and more.

BISTRO PANTRY PRODUCTS (always available):
- Wagyu Beef Tallow Original 310ml — 350 LE
- Wagyu Beef Tallow Garlic & Herbs 310ml — 375 LE
- Wagyu Beef Tallow Black Truffle 310ml — 450 LE (limited)
- Wagyu Beef Tallow Smoked 310ml — 375 LE
- Bone Broth Concentrate 310ml — 280 LE

CATERING SERVICES:
- Corporate Catering: Tailored menus, professional service, volume discounts. Covers Safaga to Ras Ghareb.
- Boat & Yacht Catering: Spill-proof packaging, fresh seafood & Mediterranean options, early marina delivery.
- Weddings & Private Events: Full-service with waitstaff, live cooking stations, elegant buffet setups.
- For corporate catering plans, suggest the AI Plan Builder at /plan-builder.`;
}

const CHAT_PROMPT_STATIC = ''; // replaced by dynamic getTodayPrompt()

const PLAN_BUILDER_PROMPT = `You are Bistro Cloud's corporate plan designer in El Gouna, Egypt. Guide the user through building a catering plan by collecting: company name, headcount, frequency, dietary needs, budget, location, contact info (name, email, phone).

Rules:
- Ask ONE question at a time
- After each question, include a JSON code block with suggested quick replies, e.g.:
\`\`\`json
["Daily (Mon-Fri)", "3x/week", "Events only"]
\`\`\`
- Once you have enough info (at minimum: company, headcount, frequency, contact email, location), generate a proposal as a JSON code block:
\`\`\`json
{ "type": "proposal", "company": "...", "contact": {...}, "headcount": N, "frequency": "...", "location": "...", "dietary": [...], "menuRotation": [{day, theme}...], "pricing": { "perPersonPerDay": N, "weeklyTotal": N, "currency": "EGP", "discounts": [...] } }
\`\`\`

CATERING PRICING — use these EXACT numbers:
- Per person per meal: EGP 600 to EGP 1,200 depending on menu selection
- Budget/simple menu (e.g. sandwich + salad): EGP 600/person
- Standard menu (e.g. main course + salad + drink): ~EGP 800/person
- Premium menu (e.g. premium main + salad + dessert): ~EGP 1,000/person
- Luxury/full-course menu (e.g. starter + premium main + salad + dessert): EGP 1,200/person

Weekly cost formula: headcount × per-meal rate × days per week
Example: 30 people × EGP 800 × 5 days = EGP 120,000/week

Discounts:
- 10% off for daily (5-day) recurring plans
- Free delivery for all corporate plans

NEVER quote prices below EGP 600/person or above EGP 1,200/person.

Service area: Safaga to Ras Ghareb (including Hurghada & El Gouna)`;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Only handle POST to the ai-chat path
  if (req.method !== 'POST' || !req.url.includes('ai-chat')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Read request body
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString());

  const { mode, messages } = body;
  const systemPrompt = mode === 'chat' ? getTodayPrompt() : PLAN_BUILDER_PROMPT;

  // Build Ollama messages format
  const ollamaMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-20),
  ];

  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  try {
    // Call Ollama streaming API
    const ollamaRes = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: ollamaMessages,
        stream: true,
      }),
    });

    if (!ollamaRes.ok || !ollamaRes.body) {
      res.write(`data: ${JSON.stringify({ error: 'Ollama error' })}\n\n`);
      res.end();
      return;
    }

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            res.write(`data: ${JSON.stringify({ token: data.message.content })}\n\n`);
          }
          if (data.done) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    // Ensure done is sent
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Error:', err);
    res.write(`data: ${JSON.stringify({ error: 'AI service error' })}\n\n`);
    res.end();
  }
});

server.listen(PORT, async () => {
  console.log(`\n  AI dev proxy running at http://localhost:${PORT}`);
  console.log(`  Using Ollama model: ${MODEL}`);
  console.log(`  Pre-warming model...`);

  // Pre-warm: load model into memory so first real request is fast
  try {
    await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: 'hi' }], stream: false }),
    });
    console.log(`  Model loaded and ready!`);
  } catch (e) {
    console.log(`  Warning: could not pre-warm model`, e.message);
  }

  console.log(`  Frontend should hit: http://localhost:${PORT}/functions/v1/ai-chat\n`);
});
