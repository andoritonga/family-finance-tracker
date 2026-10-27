import { ExpenseItem, MonthlySheet, PositionSummary, SavingsInfo } from './types';
import { getEnv, getSpreadsheetId } from './google-sheets';
import { getSheetName, parseSheetName } from './sheet-helpers';
import { cache } from './cache';

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

interface SeedSheetDef {
  name: string;
  month: number;
  year: number;
  income: number;
  incomeFormula: string;
  targetAccount: string;
  keterangan: string;
  items: Omit<ExpenseItem, 'selisih'>[];
}

const BASE_TEMPLATE_ITEMS: {
  pengeluaran: string;
  budget: number;
  posisi: string;
  keterangan: string;
}[] = [
  { pengeluaran: 'KPR / Cicilan Rumah', budget: 4500000, posisi: 'Bank Mandiri', keterangan: 'Auto-debit tanggal 5' },
  { pengeluaran: 'Belanja Bulanan & Dapur', budget: 3200000, posisi: 'BCA', keterangan: 'Supermarket & kebutuhan pokok' },
  { pengeluaran: 'Belanja Mingguan (Sayur & Lauk)', budget: 1600000, posisi: 'Cash', keterangan: 'Rp 400rb / minggu' },
  { pengeluaran: 'Dana Pendidikan Anak', budget: 1500000, posisi: 'Bank Jago', keterangan: 'SPP & les bulanan' },
  { pengeluaran: 'Bakti Orang Tua & Keluarga', budget: 1500000, posisi: 'BCA', keterangan: 'Transfer rutin awal bulan' },
  { pengeluaran: 'Transportasi, BBM & Tol', budget: 1200000, posisi: 'BCA', keterangan: 'Operasional mobilitas kerja' },
  { pengeluaran: 'Kebutuhan Anak & Susu', budget: 950000, posisi: 'BCA', keterangan: 'Susu, popok & vitamin' },
  { pengeluaran: 'Listrik PLN & Air PDAM', budget: 850000, posisi: 'SeaBank', keterangan: 'Tagihan utilitas rumah' },
  { pengeluaran: 'Rekreasi & Makan Keluarga', budget: 800000, posisi: 'Bank Jago', keterangan: 'Akhir pekan bersama keluarga' },
  { pengeluaran: 'Asuransi Kesehatan & Jiwa', budget: 750000, posisi: 'Bank Mandiri', keterangan: 'Premi proteksi keluarga' },
  { pengeluaran: 'Zakat, Infaq & Sosial', budget: 650000, posisi: 'BCA', keterangan: 'Alokasi berbagi bulanan' },
  { pengeluaran: 'Dana Darurat & Maintenance', budget: 500000, posisi: 'Blu BCA', keterangan: 'Cadangan servis rumah/kendaraan' },
  { pengeluaran: 'Internet Fiber & Kuota', budget: 450000, posisi: 'SeaBank', keterangan: 'WiFi rumah 100 Mbps' },
];

function buildInitialDemoSheets(): SeedSheetDef[] {
  // 6 months of realistic progression: Mei 2026 -> Oktober 2026
  const monthConfigs: {
    name: string;
    month: number;
    year: number;
    income: number;
    incomeFormula: string;
    actualMultipliers: Record<number, number | null>;
  }[] = [
    {
      name: 'Mei 2026',
      month: 5,
      year: 2026,
      income: 23500000,
      incomeFormula: '15000000 + 8500000',
      // Hemat / surplus month
      actualMultipliers: {
        1: 3050000, // Belanja bulanan hemat 150rb
        2: 1500000, // Belanja mingguan hemat 100rb
        5: 1100000, // BBM hemat 100rb
        7: 790000,  // Listrik hemat 60rb
        8: 650000,  // Rekreasi hemat 150rb
        11: 350000, // Maintenance hemat 150rb
      },
    },
    {
      name: 'Juni 2026',
      month: 6,
      year: 2026,
      income: 24500000,
      incomeFormula: '15000000 + 8500000 + 1000000',
      // Liburan sekolah: sedikit lebih tinggi tapi masih terkendali
      actualMultipliers: {
        1: 3180000,
        2: 1550000,
        5: 1180000,
        7: 820000,
        8: 780000,
        11: 420000,
      },
    },
    {
      name: 'Juli 2026',
      month: 7,
      year: 2026,
      income: 23500000,
      incomeFormula: '15000000 + 8500000',
      // Overbudget sedikit karena tahun ajaran baru & servis kendaraan
      actualMultipliers: {
        1: 3350000, // Over 150rb
        2: 1650000, // Over 50rb
        5: 1250000, // Over 50rb
        7: 880000,  // Over 30rb
        8: 950000,  // Over 150rb
        11: 750000, // Servis mobil over 250rb
      },
    },
    {
      name: 'Agustus 2026',
      month: 8,
      year: 2026,
      income: 23500000,
      incomeFormula: '15000000 + 8500000',
      // Bulan paling hemat (Most Efficient Month)
      actualMultipliers: {
        1: 2950000,
        2: 1450000,
        5: 1050000,
        6: 880000,
        7: 760000,
        8: 600000,
        11: 250000,
      },
    },
    {
      name: 'September 2026',
      month: 9,
      year: 2026,
      income: 24000000,
      incomeFormula: '15000000 + 8500000 + 500000',
      // Disiplin & hemat
      actualMultipliers: {
        1: 3100000,
        2: 1520000,
        5: 1150000,
        7: 810000,
        8: 720000,
        11: 400000,
      },
    },
    {
      name: 'Oktober 2026',
      month: 10,
      year: 2026,
      income: 24200000,
      incomeFormula: '15200000 + 9000000',
      // Bulan berjalan: sebagian sudah dibayar, sebagian belum dibayar agar interaktif dicoba user!
      actualMultipliers: {
        0: 4500000, // KPR paid
        1: 3120000, // Belanja bulanan paid (hemat 80rb)
        2: 1200000, // Belanja mingguan berjalan (belum lunas penuh)
        3: 1500000, // Pendidikan anak paid
        4: 1500000, // Orang tua paid
        5: null,    // BBM belum diisi
        6: 950000,  // Kebutuhan anak paid
        7: 815000,  // Listrik paid
        8: null,    // Rekreasi belum diisi
        9: 750000,  // Asuransi paid
        10: 650000, // Zakat paid
        11: null,   // Dana darurat belum diisi
        12: 450000, // Internet paid
      },
    },
  ];

  return monthConfigs.map((cfg) => {
    const isCurrentMonth = cfg.month === 10 && cfg.year === 2026;
    const items: Omit<ExpenseItem, 'selisih'>[] = BASE_TEMPLATE_ITEMS.map((base, idx) => {
      const hasCustom = Object.prototype.hasOwnProperty.call(cfg.actualMultipliers, idx);
      const aktual = hasCustom ? cfg.actualMultipliers[idx] : base.budget;
      let checklist = false;
      if (!isCurrentMonth) {
        checklist = true;
      } else {
        // For Oktober 2026, mark paid items as checked (except index 2 which is partial weekly groceries)
        checklist = aktual !== null && idx !== 2;
      }
      return {
        no: idx + 1,
        pengeluaran: base.pengeluaran,
        budget: base.budget,
        aktual,
        checklist,
        posisi: base.posisi,
        keterangan: base.keterangan,
      };
    });

    return {
      name: cfg.name,
      month: cfg.month,
      year: cfg.year,
      income: cfg.income,
      incomeFormula: cfg.incomeFormula,
      targetAccount: 'Blu BCA Saving',
      keterangan: 'Pocket Tabungan & Investasi',
      items,
    };
  });
}

export function isDemoMode(): boolean {
  const demoFlag = getEnv('DEMO_MODE');
  if (demoFlag && demoFlag.toLowerCase() === 'true') {
    return true;
  }
  const spreadsheetId = getSpreadsheetId();
  return !spreadsheetId || !spreadsheetId.trim();
}

function getD1Database(): D1Database | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    if (ctx && ctx.env && ctx.env.DB) {
      return ctx.env.DB as D1Database;
    }
  } catch {
    // Not in Cloudflare runtime or context unavailable
  }
  return null;
}

// Fallback in-memory store when running locally without D1
declare global {
  // eslint-disable-next-line no-var
  var __apbkDemoMemoryStore: {
    initialized: boolean;
    lastSeededAt: number;
    sheets: SeedSheetDef[];
  } | undefined;
}

function getMemoryStore() {
  if (!globalThis.__apbkDemoMemoryStore) {
    globalThis.__apbkDemoMemoryStore = {
      initialized: true,
      lastSeededAt: Date.now(),
      sheets: buildInitialDemoSheets(),
    };
  }
  return globalThis.__apbkDemoMemoryStore;
}

const AUTO_RESET_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function seedD1Database(db: D1Database): Promise<void> {
  const initialSheets = buildInitialDemoSheets();
  const statements: D1PreparedStatement[] = [
    db.prepare(`DROP TABLE IF EXISTS demo_expenses`),
    db.prepare(`DROP TABLE IF EXISTS demo_sheets`),
    db.prepare(`CREATE TABLE IF NOT EXISTS demo_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE demo_sheets (
      name TEXT PRIMARY KEY,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      income INTEGER NOT NULL,
      income_formula TEXT NOT NULL,
      target_account TEXT NOT NULL,
      keterangan TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE demo_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_name TEXT NOT NULL,
      no INTEGER NOT NULL,
      pengeluaran TEXT NOT NULL,
      budget INTEGER NOT NULL,
      aktual INTEGER,
      checklist INTEGER NOT NULL DEFAULT 0,
      posisi TEXT NOT NULL DEFAULT '',
      keterangan TEXT NOT NULL DEFAULT ''
    )`),
    db
      .prepare(`INSERT OR REPLACE INTO demo_meta (key, value) VALUES ('last_seeded_at', ?)`)
      .bind(String(Date.now())),
  ];

  for (const s of initialSheets) {
    statements.push(
      db
        .prepare(
          `INSERT INTO demo_sheets (name, month, year, income, income_formula, target_account, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(s.name, s.month, s.year, s.income, s.incomeFormula, s.targetAccount, s.keterangan)
    );
    for (const item of s.items) {
      statements.push(
        db
          .prepare(
            `INSERT INTO demo_expenses (sheet_name, no, pengeluaran, budget, aktual, checklist, posisi, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            s.name,
            item.no,
            item.pengeluaran,
            item.budget,
            item.aktual,
            item.checklist ? 1 : 0,
            item.posisi,
            item.keterangan
          )
      );
    }
  }

  await db.batch(statements);
}

async function ensureDemoInitialized(): Promise<D1Database | null> {
  const db = getD1Database();
  if (!db) {
    const store = getMemoryStore();
    if (Date.now() - store.lastSeededAt > AUTO_RESET_INTERVAL_MS) {
      store.sheets = buildInitialDemoSheets();
      store.lastSeededAt = Date.now();
    }
    return null;
  }

  try {
    const meta = await db
      .prepare(`SELECT value FROM demo_meta WHERE key = 'last_seeded_at'`)
      .first<{ value: string }>();
    if (!meta || !meta.value) {
      await seedD1Database(db);
    } else {
      const lastSeeded = parseInt(meta.value, 10) || 0;
      if (Date.now() - lastSeeded > AUTO_RESET_INTERVAL_MS) {
        await seedD1Database(db);
        cache.clear();
      }
    }
  } catch {
    // Table does not exist yet
    await seedD1Database(db);
  }

  return db;
}

export async function resetDemoData(): Promise<void> {
  const db = getD1Database();
  if (db) {
    await seedD1Database(db);
  }
  globalThis.__apbkDemoMemoryStore = {
    initialized: true,
    lastSeededAt: Date.now(),
    sheets: buildInitialDemoSheets(),
  };
  cache.clear();
}

function buildMonthlySheetObject(sheetDef: SeedSheetDef): MonthlySheet {
  let totalBudget = 0;
  let totalAktual = 0;
  let totalSelisih = 0;

  const positionMap = new Map<string, PositionSummary>();

  const items: ExpenseItem[] = sheetDef.items.map((raw, idx) => {
    const selisih = raw.aktual !== null && raw.aktual !== undefined ? raw.budget - raw.aktual : raw.budget;
    const isZeroDiff = raw.aktual !== null && raw.aktual !== undefined && selisih <= 0;
    const checklist = Boolean(raw.checklist || isZeroDiff);

    totalBudget += raw.budget;
    totalAktual += raw.aktual || 0;
    totalSelisih += selisih;

    const posKey = raw.posisi?.trim() || 'Lainnya';
    if (!positionMap.has(posKey)) {
      positionMap.set(posKey, { posisi: posKey, budget: 0, aktual: 0, selisih: 0 });
    }
    const pos = positionMap.get(posKey)!;
    pos.budget += raw.budget;
    pos.aktual += raw.aktual || 0;
    pos.selisih += selisih;

    return {
      no: idx + 1,
      pengeluaran: raw.pengeluaran,
      budget: raw.budget,
      aktual: raw.aktual,
      selisih,
      checklist,
      posisi: raw.posisi,
      keterangan: raw.keterangan,
    };
  });

  const savingsInfo: SavingsInfo = {
    nominal: sheetDef.income - totalBudget,
    targetAccount: sheetDef.targetAccount || 'Blu BCA Saving',
    keterangan: sheetDef.keterangan || 'Pocket Tabungan & Investasi',
    income: sheetDef.income,
    incomeFormula: sheetDef.incomeFormula,
  };

  return {
    name: sheetDef.name,
    month: sheetDef.month,
    year: sheetDef.year,
    items,
    positionSummaries: Array.from(positionMap.values()),
    savingsInfo,
    totalBudget,
    totalAktual,
    totalSelisih,
  };
}

export async function getDemoSheetList(): Promise<{ name: string; month: number; year: number }[]> {
  const db = await ensureDemoInitialized();
  if (db) {
    const { results } = await db
      .prepare(`SELECT name, month, year FROM demo_sheets ORDER BY year DESC, month DESC`)
      .all<{ name: string; month: number; year: number }>();
    return results || [];
  }

  const store = getMemoryStore();
  return [...store.sheets]
    .sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month))
    .map((s) => ({ name: s.name, month: s.month, year: s.year }));
}

export async function getDemoMonthlySheet(sheetName: string): Promise<MonthlySheet | null> {
  const db = await ensureDemoInitialized();
  if (db) {
    const sheetRow = await db
      .prepare(
        `SELECT name, month, year, income, income_formula, target_account, keterangan FROM demo_sheets WHERE name = ?`
      )
      .bind(sheetName)
      .first<{
        name: string;
        month: number;
        year: number;
        income: number;
        income_formula: string;
        target_account: string;
        keterangan: string;
      }>();

    if (!sheetRow) return null;

    const { results: expenseRows } = await db
      .prepare(
        `SELECT no, pengeluaran, budget, aktual, checklist, posisi, keterangan FROM demo_expenses WHERE sheet_name = ? ORDER BY no ASC, id ASC`
      )
      .bind(sheetName)
      .all<{
        no: number;
        pengeluaran: string;
        budget: number;
        aktual: number | null;
        checklist: number;
        posisi: string;
        keterangan: string;
      }>();

    return buildMonthlySheetObject({
      name: sheetRow.name,
      month: sheetRow.month,
      year: sheetRow.year,
      income: sheetRow.income,
      incomeFormula: sheetRow.income_formula,
      targetAccount: sheetRow.target_account,
      keterangan: sheetRow.keterangan,
      items: (expenseRows || []).map((r, i) => ({
        no: i + 1,
        pengeluaran: r.pengeluaran,
        budget: r.budget,
        aktual: r.aktual,
        checklist: Boolean(r.checklist),
        posisi: r.posisi,
        keterangan: r.keterangan,
      })),
    });
  }

  const store = getMemoryStore();
  const found = store.sheets.find((s) => s.name === sheetName);
  if (!found) return null;
  return buildMonthlySheetObject(found);
}

export async function updateDemoIncome(
  sheetName: string,
  payload: {
    income?: number;
    incomeFormula?: string;
    targetAccount?: string;
    keterangan?: string;
  }
): Promise<boolean> {
  const db = await ensureDemoInitialized();
  let cleanFormula = payload.incomeFormula?.replace(/^=/, '').trim() || '';
  let evaluatedIncome = payload.income || 0;

  if (cleanFormula && !evaluatedIncome) {
    if (/^[0-9+\-*/.\s]+$/.test(cleanFormula)) {
      try {
        const val = Function(`'use strict'; return (${cleanFormula})`)();
        if (typeof val === 'number' && !isNaN(val)) {
          evaluatedIncome = Math.round(val);
        }
      } catch {
        // ignore
      }
    }
  }
  if (!cleanFormula && evaluatedIncome) {
    cleanFormula = String(evaluatedIncome);
  }

  if (db) {
    const existing = await db
      .prepare(`SELECT income, income_formula, target_account, keterangan FROM demo_sheets WHERE name = ?`)
      .bind(sheetName)
      .first<{
        income: number;
        income_formula: string;
        target_account: string;
        keterangan: string;
      }>();
    if (!existing) return false;

    await db
      .prepare(
        `UPDATE demo_sheets SET income = ?, income_formula = ?, target_account = ?, keterangan = ? WHERE name = ?`
      )
      .bind(
        evaluatedIncome || existing.income,
        cleanFormula || existing.income_formula,
        payload.targetAccount?.trim() || existing.target_account,
        payload.keterangan?.trim() || existing.keterangan,
        sheetName
      )
      .run();
    return true;
  }

  const store = getMemoryStore();
  const found = store.sheets.find((s) => s.name === sheetName);
  if (!found) return false;
  if (evaluatedIncome) found.income = evaluatedIncome;
  if (cleanFormula) found.incomeFormula = cleanFormula;
  if (payload.targetAccount) found.targetAccount = payload.targetAccount.trim();
  if (payload.keterangan) found.keterangan = payload.keterangan.trim();
  return true;
}

export async function updateDemoExpenseItem(
  sheetName: string,
  payload: {
    rowIndex: number;
    pengeluaran?: string;
    budget?: number | string;
    aktual?: number | string | null;
    checklist?: boolean;
    posisi?: string;
    keterangan?: string;
  }
): Promise<boolean> {
  const db = await ensureDemoInitialized();
  if (db) {
    const { results } = await db
      .prepare(
        `SELECT id, no, pengeluaran, budget, aktual, checklist, posisi, keterangan FROM demo_expenses WHERE sheet_name = ? ORDER BY no ASC, id ASC`
      )
      .bind(sheetName)
      .all<{
        id: number;
        no: number;
        pengeluaran: string;
        budget: number;
        aktual: number | null;
        checklist: number;
        posisi: string;
        keterangan: string;
      }>();

    const target = results?.[payload.rowIndex];
    if (!target) return false;

    const newPengeluaran =
      payload.pengeluaran !== undefined ? payload.pengeluaran.trim() : target.pengeluaran;
    const newBudget =
      payload.budget !== undefined
        ? typeof payload.budget === 'number'
          ? payload.budget
          : parseInt(String(payload.budget || 0).replace(/[^0-9-]/g, ''), 10) || 0
        : target.budget;
    const newAktual =
      payload.aktual !== undefined
        ? payload.aktual === null || payload.aktual === ''
          ? null
          : typeof payload.aktual === 'number'
          ? payload.aktual
          : parseInt(String(payload.aktual).replace(/[^0-9-]/g, ''), 10)
        : target.aktual;
    const newPosisi = payload.posisi !== undefined ? payload.posisi.trim() : target.posisi;
    const newKeterangan =
      payload.keterangan !== undefined ? payload.keterangan.trim() : target.keterangan;

    let newChecklist = Boolean(target.checklist);
    if (payload.checklist !== undefined) {
      newChecklist = Boolean(payload.checklist);
    } else if (payload.aktual !== undefined) {
      newChecklist = newAktual !== null && newBudget - newAktual <= 0;
    }

    await db
      .prepare(
        `UPDATE demo_expenses SET pengeluaran = ?, budget = ?, aktual = ?, checklist = ?, posisi = ?, keterangan = ? WHERE id = ?`
      )
      .bind(
        newPengeluaran,
        newBudget,
        newAktual,
        newChecklist ? 1 : 0,
        newPosisi,
        newKeterangan,
        target.id
      )
      .run();

    return true;
  }

  const store = getMemoryStore();
  const sheet = store.sheets.find((s) => s.name === sheetName);
  if (!sheet || !sheet.items[payload.rowIndex]) return false;

  const item = sheet.items[payload.rowIndex];
  if (payload.pengeluaran !== undefined) item.pengeluaran = payload.pengeluaran.trim();
  if (payload.budget !== undefined) {
    item.budget =
      typeof payload.budget === 'number'
        ? payload.budget
        : parseInt(String(payload.budget || 0).replace(/[^0-9-]/g, ''), 10) || 0;
  }
  if (payload.aktual !== undefined) {
    item.aktual =
      payload.aktual === null || payload.aktual === ''
        ? null
        : typeof payload.aktual === 'number'
        ? payload.aktual
        : parseInt(String(payload.aktual).replace(/[^0-9-]/g, ''), 10);
  }
  if (payload.posisi !== undefined) item.posisi = payload.posisi.trim();
  if (payload.keterangan !== undefined) item.keterangan = payload.keterangan.trim();

  if (payload.checklist !== undefined) {
    item.checklist = Boolean(payload.checklist);
  } else if (payload.aktual !== undefined) {
    item.checklist = item.aktual !== null && item.budget - item.aktual <= 0;
  }
  return true;
}

export async function addDemoExpenseItem(
  sheetName: string,
  payload: {
    pengeluaran: string;
    budget: number | string;
    posisi?: string;
    keterangan?: string;
  }
): Promise<ExpenseItem | null> {
  const db = await ensureDemoInitialized();
  const numBudget =
    typeof payload.budget === 'number'
      ? payload.budget
      : parseInt(String(payload.budget || 0).replace(/[^0-9-]/g, ''), 10) || 0;

  if (db) {
    const maxRow = await db
      .prepare(`SELECT MAX(no) as maxNo FROM demo_expenses WHERE sheet_name = ?`)
      .bind(sheetName)
      .first<{ maxNo: number | null }>();
    const nextNo = (maxRow?.maxNo || 0) + 1;

    await db
      .prepare(
        `INSERT INTO demo_expenses (sheet_name, no, pengeluaran, budget, aktual, checklist, posisi, keterangan) VALUES (?, ?, ?, ?, NULL, 0, ?, ?)`
      )
      .bind(
        sheetName,
        nextNo,
        payload.pengeluaran.trim(),
        numBudget,
        payload.posisi?.trim() || '',
        payload.keterangan?.trim() || ''
      )
      .run();

    return {
      no: nextNo,
      pengeluaran: payload.pengeluaran.trim(),
      budget: numBudget,
      aktual: null,
      selisih: numBudget,
      checklist: false,
      posisi: payload.posisi?.trim() || '',
      keterangan: payload.keterangan?.trim() || '',
    };
  }

  const store = getMemoryStore();
  const sheet = store.sheets.find((s) => s.name === sheetName);
  if (!sheet) return null;
  const nextNo = sheet.items.length + 1;
  const newItem = {
    no: nextNo,
    pengeluaran: payload.pengeluaran.trim(),
    budget: numBudget,
    aktual: null,
    checklist: false,
    posisi: payload.posisi?.trim() || '',
    keterangan: payload.keterangan?.trim() || '',
  };
  sheet.items.push(newItem);
  return { ...newItem, selisih: numBudget };
}

export async function deleteDemoExpenseItem(sheetName: string, rowIndex: number): Promise<boolean> {
  const db = await ensureDemoInitialized();
  if (db) {
    const { results } = await db
      .prepare(`SELECT id FROM demo_expenses WHERE sheet_name = ? ORDER BY no ASC, id ASC`)
      .bind(sheetName)
      .all<{ id: number }>();
    const target = results?.[rowIndex];
    if (!target) return false;
    await db.prepare(`DELETE FROM demo_expenses WHERE id = ?`).bind(target.id).run();
    return true;
  }

  const store = getMemoryStore();
  const sheet = store.sheets.find((s) => s.name === sheetName);
  if (!sheet || !sheet.items[rowIndex]) return false;
  sheet.items.splice(rowIndex, 1);
  sheet.items.forEach((it, idx) => {
    it.no = idx + 1;
  });
  return true;
}

export async function generateDemoSheet(params: {
  sourceMonth?: number;
  sourceYear?: number;
  targetMonth?: number;
  targetYear?: number;
}): Promise<{ sheet?: { name: string; month: number; year: number }; error?: string; status?: number }> {
  const allSheets = await getDemoSheetList();
  if (allSheets.length === 0) {
    return { error: 'No existing sheets to use as source', status: 400 };
  }

  let sourceInfo = allSheets[0];
  if (params.sourceMonth && params.sourceYear) {
    const found = allSheets.find(
      (s) => s.month === params.sourceMonth && s.year === params.sourceYear
    );
    if (!found) return { error: 'Source sheet not found', status: 404 };
    sourceInfo = found;
  }

  const tMonth =
    params.targetMonth || (sourceInfo.month === 12 ? 1 : sourceInfo.month + 1);
  const tYear =
    params.targetYear || (sourceInfo.month === 12 ? sourceInfo.year + 1 : sourceInfo.year);
  const targetName = getSheetName(tMonth, tYear);

  if (allSheets.some((s) => s.name === targetName)) {
    return { error: `Sheet ${targetName} already exists`, status: 400 };
  }

  const sourceSheet = await getDemoMonthlySheet(sourceInfo.name);
  if (!sourceSheet) {
    return { error: 'Failed to read source sheet', status: 500 };
  }

  const db = await ensureDemoInitialized();
  if (db) {
    const stmts: D1PreparedStatement[] = [
      db
        .prepare(
          `INSERT INTO demo_sheets (name, month, year, income, income_formula, target_account, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          targetName,
          tMonth,
          tYear,
          sourceSheet.savingsInfo?.income || 24200000,
          sourceSheet.savingsInfo?.incomeFormula || '15200000 + 9000000',
          sourceSheet.savingsInfo?.targetAccount || 'Blu BCA Saving',
          sourceSheet.savingsInfo?.keterangan || 'Pocket Tabungan & Investasi'
        ),
    ];

    sourceSheet.items.forEach((item, idx) => {
      stmts.push(
        db
          .prepare(
            `INSERT INTO demo_expenses (sheet_name, no, pengeluaran, budget, aktual, checklist, posisi, keterangan) VALUES (?, ?, ?, ?, NULL, 0, ?, ?)`
          )
          .bind(
            targetName,
            idx + 1,
            item.pengeluaran,
            item.budget,
            item.posisi,
            item.keterangan
          )
      );
    });

    await db.batch(stmts);
  } else {
    const store = getMemoryStore();
    store.sheets.push({
      name: targetName,
      month: tMonth,
      year: tYear,
      income: sourceSheet.savingsInfo?.income || 24200000,
      incomeFormula: sourceSheet.savingsInfo?.incomeFormula || '15200000 + 9000000',
      targetAccount: sourceSheet.savingsInfo?.targetAccount || 'Blu BCA Saving',
      keterangan: sourceSheet.savingsInfo?.keterangan || 'Pocket Tabungan & Investasi',
      items: sourceSheet.items.map((item, idx) => ({
        no: idx + 1,
        pengeluaran: item.pengeluaran,
        budget: item.budget,
        aktual: null,
        checklist: false,
        posisi: item.posisi,
        keterangan: item.keterangan,
      })),
    });
  }

  cache.clear();
  return {
    sheet: {
      name: targetName,
      month: tMonth,
      year: tYear,
    },
  };
}

export async function getDemoAnalytics() {
  const sheetList = await getDemoSheetList();
  const validMonthlySheets = [...sheetList]
    .filter((s) => parseSheetName(s.name) !== null)
    .sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));

  if (validMonthlySheets.length === 0) {
    return {
      monthlyTrends: [],
      topExpenses: [],
      positionDistribution: [],
      kpi: null,
    };
  }

  const monthlyTrends: {
    name: string;
    month: number;
    year: number;
    budget: number;
    aktual: number;
    selisih: number;
    income?: number;
    savings?: number;
    percentUsed: number;
    itemCount: number;
    isSurplus: boolean;
  }[] = [];

  const expenseCategoryMap = new Map<
    string,
    {
      name: string;
      totalBudget: number;
      totalAktual: number;
      occurrences: number;
      positions: Set<string>;
    }
  >();

  const positionMap = new Map<
    string,
    {
      posisi: string;
      totalBudget: number;
      totalAktual: number;
      totalSelisih: number;
    }
  >();

  let totalAnnualBudget = 0;
  let totalAnnualAktual = 0;
  let totalAnnualSelisih = 0;
  let totalAnnualIncome = 0;
  let totalAnnualSavings = 0;
  let surplusMonthsCount = 0;

  for (const sheetInfo of validMonthlySheets) {
    const sheetData = await getDemoMonthlySheet(sheetInfo.name);
    if (!sheetData) continue;

    const { items, savingsInfo } = sheetData;
    let mBudget = 0;
    let mAktual = 0;
    let mSelisih = 0;

    items.forEach((item) => {
      mBudget += item.budget;
      mAktual += item.aktual || 0;
      mSelisih += item.selisih || 0;

      const normName = item.pengeluaran.trim();
      if (normName) {
        if (!expenseCategoryMap.has(normName)) {
          expenseCategoryMap.set(normName, {
            name: normName,
            totalBudget: 0,
            totalAktual: 0,
            occurrences: 0,
            positions: new Set<string>(),
          });
        }
        const cat = expenseCategoryMap.get(normName)!;
        cat.totalBudget += item.budget;
        cat.totalAktual += item.aktual || 0;
        cat.occurrences += 1;
        if (item.posisi) {
          cat.positions.add(item.posisi.trim());
        }
      }

      const posName = item.posisi ? item.posisi.trim() : 'Lainnya';
      if (!positionMap.has(posName)) {
        positionMap.set(posName, {
          posisi: posName,
          totalBudget: 0,
          totalAktual: 0,
          totalSelisih: 0,
        });
      }
      const pObj = positionMap.get(posName)!;
      pObj.totalBudget += item.budget;
      pObj.totalAktual += item.aktual || 0;
      pObj.totalSelisih += item.selisih || 0;
    });

    const mIncome =
      savingsInfo?.income || (savingsInfo?.nominal ? savingsInfo.nominal + mBudget : mBudget);
    const mSavings = savingsInfo?.nominal ?? Math.max(0, mIncome - mBudget);

    totalAnnualBudget += mBudget;
    totalAnnualAktual += mAktual;
    totalAnnualSelisih += mSelisih;
    totalAnnualIncome += mIncome;
    totalAnnualSavings += mSavings;

    const isSurplus = mBudget - mAktual >= 0;
    if (isSurplus) surplusMonthsCount++;

    const percentUsed = mBudget > 0 ? (mAktual / mBudget) * 100 : 0;

    monthlyTrends.push({
      name: sheetInfo.name,
      month: sheetInfo.month,
      year: sheetInfo.year,
      budget: mBudget,
      aktual: mAktual,
      selisih: mBudget - mAktual,
      income: mIncome,
      savings: mSavings,
      percentUsed,
      itemCount: items.length,
      isSurplus,
    });
  }

  const totalMonths = validMonthlySheets.length;
  const avgMonthlySpend = totalMonths > 0 ? totalAnnualAktual / totalMonths : 0;
  const avgMonthlyBudget = totalMonths > 0 ? totalAnnualBudget / totalMonths : 0;
  const disciplineRate = totalMonths > 0 ? (surplusMonthsCount / totalMonths) * 100 : 0;

  let lowestSpendMonth = monthlyTrends[0];
  let highestSpendMonth = monthlyTrends[0];

  monthlyTrends.forEach((m) => {
    if (m.aktual > 0 && m.aktual < (lowestSpendMonth.aktual || Infinity)) {
      lowestSpendMonth = m;
    }
    if (m.aktual > highestSpendMonth.aktual) {
      highestSpendMonth = m;
    }
  });

  const totalBenchmark = totalAnnualAktual > 0 ? totalAnnualAktual : totalAnnualBudget;
  const topExpenses = Array.from(expenseCategoryMap.values())
    .map((cat) => {
      const val = cat.totalAktual > 0 ? cat.totalAktual : cat.totalBudget;
      const percentOfTotal = totalBenchmark > 0 ? (val / totalBenchmark) * 100 : 0;
      return {
        name: cat.name,
        totalBudget: cat.totalBudget,
        totalAktual: cat.totalAktual,
        avgMonthly:
          cat.totalAktual > 0 ? cat.totalAktual / totalMonths : cat.totalBudget / totalMonths,
        percentOfTotal: Number(percentOfTotal.toFixed(1)),
        occurrences: cat.occurrences,
        positions: Array.from(cat.positions),
      };
    })
    .sort((a, b) => (b.totalAktual || b.totalBudget) - (a.totalAktual || a.totalBudget))
    .slice(0, 10);

  const positionDistribution = Array.from(positionMap.values())
    .map((p) => ({
      posisi: p.posisi,
      totalBudget: p.totalBudget,
      totalAktual: p.totalAktual,
      totalSelisih: p.totalSelisih,
      budgetPercentage: totalAnnualBudget > 0 ? (p.totalBudget / totalAnnualBudget) * 100 : 0,
      percentage: totalAnnualAktual > 0 ? (p.totalAktual / totalAnnualAktual) * 100 : 0,
    }))
    .sort((a, b) => (b.totalAktual || b.totalBudget) - (a.totalAktual || a.totalBudget));

  const avgMonthlyIncome = totalMonths > 0 ? totalAnnualIncome / totalMonths : 0;
  const avgMonthlySavings = totalMonths > 0 ? totalAnnualSavings / totalMonths : 0;
  const savingsRate = totalAnnualIncome > 0 ? (totalAnnualSavings / totalAnnualIncome) * 100 : 0;

  return {
    kpi: {
      totalMonths,
      totalAnnualIncome,
      totalAnnualSavings,
      totalAnnualBudget,
      totalAnnualAktual,
      totalAnnualSelisih,
      avgMonthlySpend,
      avgMonthlyBudget,
      avgMonthlyIncome,
      avgMonthlySavings,
      savingsRate: Number(savingsRate.toFixed(1)),
      disciplineRate,
      lowestSpendMonth: {
        name: lowestSpendMonth.name,
        aktual: lowestSpendMonth.aktual,
      },
      highestSpendMonth: {
        name: highestSpendMonth.name,
        aktual: highestSpendMonth.aktual,
      },
    },
    monthlyTrends,
    topExpenses,
    positionDistribution,
  };
}
