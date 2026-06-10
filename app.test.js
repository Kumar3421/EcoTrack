import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

beforeAll(() => {
  // Mock standard DOM globals
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => null
  };

  // Evaluate data.js and app.js in global context
  let dataCode = fs.readFileSync(path.resolve(__dirname, 'data.js'), 'utf8');
  // Expose global constants to globalThis so new Function executes them in global scope
  dataCode = dataCode.replace(/const (EF|CAT_COLORS|PRESETS|TIPS|BADGES|CHALLENGES|LEVELS|DAILY_AVG) =/g, 'globalThis.$1 =');
  const appCode = fs.readFileSync(path.resolve(__dirname, 'app.js'), 'utf8');

  // Run them in global context
  (new Function(dataCode))();
  (new Function(appCode))();
});

describe('EcoTrack Unit Tests', () => {
  it('should verify calcCO2 calculations', () => {
    const { calcCO2 } = globalThis.test_exports;
    
    // Transport - petrol car (f: 0.192) * 10 km = 1.92 kg CO2
    expect(calcCO2('transport', 'car_petrol', 10)).toBe(1.92);
    
    // Food - beef (f: 6.61) * 2 servings = 13.22 kg CO2
    expect(calcCO2('food', 'beef', 2)).toBe(13.22);
    
    // Waste - recycling (f: 0.021) * 5 kg = 0.105 kg CO2
    expect(calcCO2('waste', 'recycling', 5)).toBe(0.105);
  });

  it('should verify levels calculation', () => {
    const { getLevel } = globalThis.test_exports;
    
    // Level 1: 0 XP
    const lvl1 = getLevel(0);
    expect(lvl1.lv).toBe(1);
    expect(lvl1.t).toBe('Seedling');
    
    // Level 2: 50 XP
    const lvl2 = getLevel(50);
    expect(lvl2.lv).toBe(2);
    expect(lvl2.t).toBe('Sprout');

    // Level 3: 150 XP
    const lvl3 = getLevel(200);
    expect(lvl3.lv).toBe(3);
    expect(lvl3.t).toBe('Sapling');
  });

  it('should verify HTML sanitizer', () => {
    const { escapeHTML } = globalThis.test_exports;
    
    expect(escapeHTML('<div>test</div>')).toBe('&lt;div&gt;test&lt;/div&gt;');
    expect(escapeHTML('test & "test"')).toBe('test &amp; &quot;test&quot;');
  });

  it('should verify defaults returns correct structure', () => {
    const { defaults } = globalThis.test_exports;
    const def = defaults();
    expect(def.logs).toEqual([]);
    expect(def.streak).toBe(0);
    expect(def.theme).toBe('dark');
  });
});
