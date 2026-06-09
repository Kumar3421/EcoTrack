// ============================================================
// EcoTrack — Data Layer
// Emission factors, activity presets, tips, badges & challenges
// ============================================================

const EF = {
  transport: { label: 'Transport', icon: '🚗', color: '#f59e0b', acts: {
    car_petrol:   { l: 'Car (Petrol)',       u: 'km',    f: 0.192, i: '🚗' },
    car_diesel:   { l: 'Car (Diesel)',       u: 'km',    f: 0.171, i: '🚙' },
    car_ev:       { l: 'Car (Electric)',     u: 'km',    f: 0.053, i: '⚡' },
    bus:          { l: 'Bus',                u: 'km',    f: 0.089, i: '🚌' },
    train:        { l: 'Train',              u: 'km',    f: 0.041, i: '🚆' },
    subway:       { l: 'Subway',             u: 'km',    f: 0.033, i: '🚇' },
    flight_dom:   { l: 'Flight (Domestic)',  u: 'km',    f: 0.255, i: '✈️' },
    flight_long:  { l: 'Flight (Long-haul)', u: 'km',    f: 0.195, i: '🛫' },
    motorcycle:   { l: 'Motorcycle',         u: 'km',    f: 0.113, i: '🏍️' },
    bicycle:      { l: 'Bicycle',            u: 'km',    f: 0,     i: '🚲' },
    walking:      { l: 'Walking',            u: 'km',    f: 0,     i: '🚶' },
    taxi:         { l: 'Taxi / Rideshare',   u: 'km',    f: 0.21,  i: '🚕' }
  }},
  energy: { label: 'Energy', icon: '⚡', color: '#818cf8', acts: {
    electricity:  { l: 'Electricity',       u: 'kWh',   f: 0.417, i: '💡' },
    natural_gas:  { l: 'Natural Gas',       u: 'kWh',   f: 0.203, i: '🔥' },
    heating_oil:  { l: 'Heating Oil',       u: 'litre', f: 2.54,  i: '🛢️' },
    ac:           { l: 'Air Conditioning',  u: 'hours', f: 0.875, i: '❄️' },
    heating:      { l: 'Space Heating',     u: 'hours', f: 1.1,   i: '🌡️' },
    solar:        { l: 'Solar Panel',       u: 'kWh',   f: -0.417, i: '☀️' }
  }},
  food: { label: 'Food', icon: '🍔', color: '#34d399', acts: {
    beef:         { l: 'Beef',               u: 'serving', f: 6.61, i: '🥩' },
    lamb:         { l: 'Lamb',               u: 'serving', f: 5.84, i: '🍖' },
    pork:         { l: 'Pork',               u: 'serving', f: 2.4,  i: '🥓' },
    chicken:      { l: 'Chicken',            u: 'serving', f: 1.82, i: '🍗' },
    fish:         { l: 'Fish',               u: 'serving', f: 1.34, i: '🐟' },
    dairy:        { l: 'Dairy',              u: 'serving', f: 1.29, i: '🧀' },
    eggs:         { l: 'Eggs',               u: 'serving', f: 0.53, i: '🥚' },
    vegetables:   { l: 'Vegetables',         u: 'serving', f: 0.19, i: '🥦' },
    fruits:       { l: 'Fruits',             u: 'serving', f: 0.21, i: '🍎' },
    grains:       { l: 'Grains / Rice',      u: 'serving', f: 0.44, i: '🍚' },
    coffee:       { l: 'Coffee',             u: 'cup',     f: 0.21, i: '☕' },
    plant_meal:   { l: 'Plant-based Meal',   u: 'meal',    f: 0.38, i: '🥗' },
    fast_food:    { l: 'Fast Food',          u: 'meal',    f: 3.6,  i: '🍟' }
  }},
  shopping: { label: 'Shopping', icon: '🛍️', color: '#f472b6', acts: {
    clothing:     { l: 'New Clothing',      u: 'item',  f: 10,   i: '👕' },
    electronics:  { l: 'Electronics',       u: 'item',  f: 50,   i: '📱' },
    furniture:    { l: 'Furniture',         u: 'item',  f: 75,   i: '🪑' },
    books:        { l: 'Books / Paper',     u: 'item',  f: 1.1,  i: '📚' },
    secondhand:   { l: 'Second-hand',       u: 'item',  f: 0.5,  i: '♻️' },
    online_order: { l: 'Online Order',       u: 'order', f: 3.2,  i: '📦' }
  }},
  waste: { label: 'Waste', icon: '♻️', color: '#2dd4bf', acts: {
    landfill:     { l: 'Landfill',          u: 'kg',    f: 0.587, i: '🗑️' },
    recycling:    { l: 'Recycling',         u: 'kg',    f: 0.021, i: '♻️' },
    composting:   { l: 'Composting',        u: 'kg',    f: 0.01,  i: '🌱' },
    plastic_bag:  { l: 'Plastic Bags',       u: 'bag',   f: 0.033, i: '🛒' },
    food_waste:   { l: 'Food Waste',        u: 'kg',    f: 0.7,   i: '🍌' }
  }}
};

const CAT_COLORS = {
  transport: '#f59e0b',
  energy: '#818cf8',
  food: '#34d399',
  shopping: '#f472b6',
  waste: '#2dd4bf'
};

const PRESETS = [
  { id: 'p1', l: 'Drive to work',     cat: 'transport', act: 'car_petrol',  amt: 15, i: '🚗' },
  { id: 'p2', l: 'Bus commute',        cat: 'transport', act: 'bus',         amt: 10, i: '🚌' },
  { id: 'p3', l: 'Home electricity',    cat: 'energy',    act: 'electricity', amt: 8,  i: '💡' },
  { id: 'p4', l: 'Meat lunch',          cat: 'food',      act: 'chicken',     amt: 1,  i: '🍗' },
  { id: 'p5', l: 'Veggie lunch',        cat: 'food',      act: 'plant_meal',   amt: 1,  i: '🥗' },
  { id: 'p6', l: 'Cup of coffee',       cat: 'food',      act: 'coffee',       amt: 1,  i: '☕' },
  { id: 'p7', l: 'Recycled waste',      cat: 'waste',     act: 'recycling',   amt: 2,  i: '♻️' },
  { id: 'p8', l: 'Trash bag',           cat: 'waste',     act: 'landfill',    amt: 3,  i: '🗑️' }
];

const TIPS = [
  { id: 1,  cat: 'transport', imp: 'high',   t: 'Carpool with colleagues — sharing cuts transport emissions by 66%.', s: 1200 },
  { id: 2,  cat: 'transport', imp: 'high',   t: 'Switch to public transit — buses emit 75% less CO₂ per km than cars.', s: 1500 },
  { id: 3,  cat: 'transport', imp: 'medium', t: 'Bike for trips under 5 km — zero emissions and great exercise.', s: 300 },
  { id: 4,  cat: 'transport', imp: 'high',   t: 'Consider an EV — they produce 50-70% fewer lifecycle emissions.', s: 2000 },
  { id: 5,  cat: 'energy',    imp: 'high',   t: 'Switch to renewable energy — eliminate your electricity emissions.', s: 2500 },
  { id: 6,  cat: 'energy',    imp: 'medium', t: 'Replace bulbs with LEDs — 75% less energy, 25x longer life.', s: 200 },
  { id: 7,  cat: 'energy',    imp: 'medium', t: 'Lower thermostat by 1°C — cuts heating emissions by ~7%.', s: 300 },
  { id: 8,  cat: 'energy',    imp: 'high',   t: 'Install solar panels — offset 3-4 tonnes CO₂/year.', s: 3500 },
  { id: 9,  cat: 'food',      imp: 'high',   t: 'Have one meatless day/week — save ~200 kg CO₂/year.', s: 200 },
  { id: 10, cat: 'food',      imp: 'high',   t: 'Reduce beef — it produces 10x more emissions than chicken.', s: 600 },
  { id: 11, cat: 'food',      imp: 'medium', t: 'Buy seasonal local produce — lower transport footprint.', s: 150 },
  { id: 12, cat: 'food',      imp: 'high',   t: 'Try a plant-based diet — reduce food emissions by up to 73%.', s: 900 },
  { id: 13, cat: 'shopping',  imp: 'high',   t: 'Buy fewer, quality clothes — fast fashion is a top polluter.', s: 400 },
  { id: 14, cat: 'shopping',  imp: 'medium', t: 'Repair instead of replacing — extend product life by 9 months.', s: 200 },
  { id: 15, cat: 'waste',     imp: 'high',   t: 'Compost food scraps — diverts waste from landfills.', s: 200 },
  { id: 16, cat: 'waste',     imp: 'high',   t: 'Recycle properly — check local guidelines to avoid contamination.', s: 300 },
  { id: 17, cat: 'general',   imp: 'high',   t: 'Track your footprint weekly — awareness leads to 5-10% reductions.', s: 400 },
  { id: 18, cat: 'general',   imp: 'medium', t: 'Plant a tree — absorbs up to 22 kg CO₂/year.', s: 22 }
];

const BADGES = [
  { id: 'first_log',      l: 'First Step',        i: '🌱', d: 'Log your first activity',                    c: { t: 'logs', n: 1 } },
  { id: 'week_streak',    l: 'Week Warrior',       i: '🔥', d: '7-day logging streak',                       c: { t: 'streak', n: 7 } },
  { id: 'month_streak',   l: 'Consistency King',   i: '👑', d: '30-day logging streak',                      c: { t: 'streak', n: 30 } },
  { id: 'ten_logs',       l: 'Getting Started',    i: '📊', d: 'Log 10 activities',                         c: { t: 'logs', n: 10 } },
  { id: 'fifty_logs',     l: 'Data Driven',        i: '📈', d: 'Log 50 activities',                         c: { t: 'logs', n: 50 } },
  { id: 'hundred_logs',   l: 'Carbon Accountant',  i: '🏆', d: 'Log 100 activities',                        c: { t: 'logs', n: 100 } },
  { id: 'zero_transport', l: 'Car-Free Day',       i: '🚶', d: 'Zero-emission transport day',                c: { t: 'special' } },
  { id: 'green_meal',     l: 'Green Gourmet',      i: '🥗', d: 'Log 5 plant-based meals',                   c: { t: 'act_count', a: 'plant_meal', n: 5 } },
  { id: 'recycler',       l: 'Recycling Pro',      i: '♻️', d: 'Recycle 10 times',                          c: { t: 'act_count', a: 'recycling', n: 10 } },
  { id: 'low_day',        l: 'Light Footprint',    i: '🦶', d: 'Day under 2 kg CO₂',                         c: { t: 'low_day', n: 2 } },
  { id: 'ultra_low',      l: 'Carbon Ninja',       i: '🥷', d: 'Day under 1 kg CO₂',                         c: { t: 'low_day', n: 1 } },
  { id: 'all_cats',       l: 'All-Rounder',        i: '🌍', d: 'All 5 categories in one day',                c: { t: 'special' } },
  { id: 'goal_set',       l: 'Goal Setter',        i: '🎯', d: 'Set your first goal',                        c: { t: 'special' } },
  { id: 'goal_done',      l: 'Goal Crusher',       i: '💪', d: 'Achieve a weekly goal',                       c: { t: 'special' } },
  { id: 'ch_first',       l: 'Challenge Accepted', i: '⚡', d: 'Complete a daily challenge',                c: { t: 'ch', n: 1 } },
  { id: 'ch_ten',         l: 'Eco Champion',       i: '🏅', d: 'Complete 10 challenges',                      c: { t: 'ch', n: 10 } }
];

const CHALLENGES = [
  { id: 'c1',  t: 'Eat only plant-based meals today',                     xp: 30, cat: 'food',      diff: 'medium' },
  { id: 'c2',  t: "Don't use a car today — walk, bike, or transit",       xp: 40, cat: 'transport', diff: 'hard' },
  { id: 'c3',  t: 'Take a 5-minute shower or less',                       xp: 15, cat: 'energy',    diff: 'easy' },
  { id: 'c4',  t: 'Unplug 3 unused devices',                             xp: 10, cat: 'energy',    diff: 'easy' },
  { id: 'c5',  t: 'Use only reusable bags and bottles',                   xp: 15, cat: 'waste',     diff: 'easy' },
  { id: 'c6',  t: "Don't place any online orders today",                  xp: 20, cat: 'shopping',  diff: 'medium' },
  { id: 'c7',  t: 'Compost all food scraps today',                        xp: 20, cat: 'waste',     diff: 'medium' },
  { id: 'c8',  t: 'Do laundry in cold water',                             xp: 15, cat: 'energy',    diff: 'easy' },
  { id: 'c9',  t: 'Walk at least 3 km instead of driving',                xp: 25, cat: 'transport', diff: 'medium' },
  { id: 'c10', t: 'Eat leftovers instead of cooking new',                 xp: 15, cat: 'food',      diff: 'easy' },
  { id: 'c11', t: 'Turn off lights when leaving rooms — all day',         xp: 10, cat: 'energy',    diff: 'easy' },
  { id: 'c12', t: 'Avoid all single-use plastics today',                  xp: 30, cat: 'waste',     diff: 'hard' },
  { id: 'c13', t: 'Buy only locally sourced food today',                  xp: 25, cat: 'food',      diff: 'medium' },
  { id: 'c14', t: 'Repair something instead of replacing it',             xp: 35, cat: 'shopping',  diff: 'hard' },
  { id: 'c15', t: 'Air dry laundry instead of the dryer',                 xp: 15, cat: 'energy',    diff: 'easy' },
  { id: 'c16', t: 'Bike to your destination today',                       xp: 30, cat: 'transport', diff: 'medium' },
  { id: 'c17', t: 'Skip beef and lamb today',                             xp: 20, cat: 'food',      diff: 'easy' },
  { id: 'c18', t: 'Go paperless — no printing today',                     xp: 10, cat: 'waste',     diff: 'easy' },
  { id: 'c19', t: 'Use public transit for all trips',                     xp: 30, cat: 'transport', diff: 'medium' },
  { id: 'c20', t: 'If you need something, buy second-hand',              xp: 25, cat: 'shopping',  diff: 'medium' }
];

const LEVELS = [
  { lv: 1,  t: 'Seedling',            xp: 0,    i: '🌱' },
  { lv: 2,  t: 'Sprout',              xp: 50,   i: '🌿' },
  { lv: 3,  t: 'Sapling',             xp: 150,  i: '🌳' },
  { lv: 4,  t: 'Green Thumb',         xp: 300,  i: '💚' },
  { lv: 5,  t: 'Eco Warrior',         xp: 500,  i: '⚔️' },
  { lv: 6,  t: 'Planet Protector',    xp: 800,  i: '🛡️' },
  { lv: 7,  t: 'Climate Champion',    xp: 1200, i: '🏆' },
  { lv: 8,  t: 'Earth Guardian',      xp: 1800, i: '🌍' },
  { lv: 9,  t: 'Sustainability Sage',  xp: 2500, i: '🧙' },
  { lv: 10, t: 'Carbon Zero Hero',    xp: 3500, i: '✨' }
];

const DAILY_AVG = 12.88;
