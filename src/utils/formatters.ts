export const formatSwedishDate = (value: string): string => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
};

export const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDaysToDateInput = (value: string, days: number): string => {
  const [year, month, day] = value.split('-').map(Number);
  const date = year && month && day ? new Date(year, month - 1, day) : new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
};
