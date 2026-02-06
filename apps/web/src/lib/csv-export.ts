/**
 * CSV 생성 및 다운로드 유틸리티
 */

interface CsvColumn<T> {
  readonly key: keyof T;
  readonly header: string;
}

/** 값을 CSV 셀에 안전한 문자열로 변환 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // 쉼표, 줄바꿈, 큰따옴표가 포함되면 큰따옴표로 감싸기
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * 데이터 배열과 컬럼 정의를 받아 CSV 문자열을 생성한다.
 * BOM을 포함하여 엑셀에서 한국어가 깨지지 않도록 한다.
 */
export function generateCsv<T extends Record<string, unknown>>(
  data: readonly T[],
  columns: readonly CsvColumn<T>[],
): string {
  const BOM = '\uFEFF';
  const headerRow = columns.map((col) => escapeCsvValue(col.header)).join(',');

  const dataRows = data.map((row) =>
    columns.map((col) => escapeCsvValue(row[col.key])).join(','),
  );

  return BOM + [headerRow, ...dataRows].join('\n');
}

/**
 * CSV 문자열을 파일로 다운로드한다.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // 정리
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
