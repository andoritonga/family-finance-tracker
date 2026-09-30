import { NextRequest, NextResponse } from 'next/server';
import { getSheets, getSpreadsheetId } from '@/lib/google-sheets';
import { parseSheetData, parseSheetName } from '@/lib/sheet-helpers';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const cacheKey = 'analytics';

    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    const sheets = getSheets();
    const spreadsheetId = getSpreadsheetId();

    // 1. Get all sheet metadata
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const allSheetList = meta.data.sheets || [];
    const validMonthlySheets: { name: string; month: number; year: number }[] = [];

    allSheetList.forEach((s) => {
      const title = s.properties?.title;
      if (title) {
        const parsed = parseSheetName(title);
        if (parsed) {
          validMonthlySheets.push({
            name: title,
            month: parsed.month,
            year: parsed.year,
          });
        }
      }
    });

    if (validMonthlySheets.length === 0) {
      return NextResponse.json({
        monthlyTrends: [],
        topExpenses: [],
        positionDistribution: [],
        kpi: null,
      });
    }

    // Sort chronologically (earliest to latest: Jan -> Dec)
    validMonthlySheets.sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));

    // 2. Fetch all monthly sheets in a single batch request
    const batchRanges = validMonthlySheets.map((s) => `'${s.name}'!A:H`);
    const batchRes = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: batchRanges,
    });

    const valueRanges = batchRes.data.valueRanges || [];

    // Data structures for aggregation
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

    // Process each month's data
    validMonthlySheets.forEach((sheetInfo, idx) => {
      const rows = valueRanges[idx]?.values || [];
      const { items, savingsInfo } = parseSheetData(rows);

      let mBudget = 0;
      let mAktual = 0;
      let mSelisih = 0;

      items.forEach((item) => {
        mBudget += item.budget;
        mAktual += item.aktual || 0;
        mSelisih += item.selisih || 0;

        // Group expense items by normalized name (Gabungkan Fani 1 & 2 serta Rumah M.Ritonga 1 & 2 di pos pengeluaran)
        let normName = item.pengeluaran.trim();
        if (/^fani\s*[12]$/i.test(normName) || /^fani$/i.test(normName)) {
          normName = 'Fani';
        } else if (/^rumah\s*m\.?\s*ritonga.*matondang\s*[12]?$/i.test(normName)) {
          normName = 'Rumah M.Ritonga/br. Matondang';
        }

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

        // Group by Posisi / Rekening (Tetap terpisah per rekening)
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

      const mIncome = savingsInfo?.income || (savingsInfo?.nominal ? savingsInfo.nominal + mBudget : mBudget);
      const mSavings = savingsInfo?.nominal || Math.max(0, mIncome - mBudget);

      totalAnnualBudget += mBudget;
      totalAnnualAktual += mAktual;
      totalAnnualSelisih += mSelisih;
      totalAnnualIncome += mIncome;
      totalAnnualSavings += mSavings;

      const isSurplus = mSelisih >= 0;
      if (isSurplus) surplusMonthsCount++;

      const percentUsed = mBudget > 0 ? (mAktual / mBudget) * 100 : 0;

      monthlyTrends.push({
        name: sheetInfo.name,
        month: sheetInfo.month,
        year: sheetInfo.year,
        budget: mBudget,
        aktual: mAktual,
        selisih: mSelisih,
        income: mIncome,
        savings: mSavings,
        percentUsed,
        itemCount: items.length,
        isSurplus,
      });
    });

    const totalMonths = validMonthlySheets.length;
    const avgMonthlySpend = totalMonths > 0 ? totalAnnualAktual / totalMonths : 0;
    const avgMonthlyBudget = totalMonths > 0 ? totalAnnualBudget / totalMonths : 0;
    const disciplineRate = totalMonths > 0 ? (surplusMonthsCount / totalMonths) * 100 : 0;

    // Find lowest and highest spending months
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

    // Top 10 expenses sorted by total aktual (or total budget)
    const totalBenchmark = totalAnnualAktual > 0 ? totalAnnualAktual : totalAnnualBudget;
    const topExpenses = Array.from(expenseCategoryMap.values())
      .map((cat) => {
        const val = cat.totalAktual > 0 ? cat.totalAktual : cat.totalBudget;
        const percentOfTotal = totalBenchmark > 0 ? (val / totalBenchmark) * 100 : 0;
        return {
          name: cat.name,
          totalBudget: cat.totalBudget,
          totalAktual: cat.totalAktual,
          avgMonthly: cat.totalAktual > 0 ? cat.totalAktual / totalMonths : cat.totalBudget / totalMonths,
          percentOfTotal: Number(percentOfTotal.toFixed(1)),
          occurrences: cat.occurrences,
          positions: Array.from(cat.positions),
        };
      })
      .sort((a, b) => (b.totalAktual || b.totalBudget) - (a.totalAktual || a.totalBudget))
      .slice(0, 10);

    // Position distribution sorted by total aktual
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

    const result = {
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

    cache.set(cacheKey, result, 120);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data analytics', details: error.message },
      { status: 500 }
    );
  }
}
