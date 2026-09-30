import { BulanClient } from './BulanClient';

export const dynamicParams = true;

export function generateStaticParams() {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  const years = ['2024', '2025', '2026', '2027'];
  const params: { sheetName: string }[] = [];
  for (const year of years) {
    for (const month of months) {
      params.push({ sheetName: `${month} ${year}` });
    }
  }
  return params;
}

export default async function BulanPage({
  params,
}: {
  params: Promise<{ sheetName: string }>;
}) {
  const { sheetName: rawSheetName } = await params;
  const sheetName = rawSheetName ? decodeURIComponent(rawSheetName) : '';
  return <BulanClient sheetName={sheetName} />;
}
