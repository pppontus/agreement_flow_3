import type {
  Address,
  DateSelection,
  FacilityHandling,
  Invoice,
  Product,
} from '../types';

export const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);
export const isValidPhone = (value: string) =>
  /^07[02369]\d{7}$/.test(value.replace(/\D/g, ''));
export const isValidAddress = (address: Address | null): address is Address =>
  Boolean(
    address &&
    address.street.trim() &&
    address.number.trim() &&
    /^\d{5}$/.test(address.postalCode) &&
    address.city.trim(),
  );
export const isValidDateSelection = (
  value: DateSelection | null,
): value is DateSelection => {
  if (
    !value ||
    !['EARLIEST', 'SPECIFIC'].includes(value.mode) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value.date)
  )
    return false;
  const parsed = new Date(`${value.date}T12:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value.date
  );
};
export const requiresRiskConsent = (type: Product['type'] | undefined) =>
  type === 'FAST' || type === 'KVARTS';
export const isValidFacilityHandling = (value: FacilityHandling | null) =>
  Boolean(
    value &&
    (value.mode === 'FETCH_WITH_POWER_OF_ATTORNEY' || value.facilityId?.trim()),
  );
export const isValidInvoice = (invoice: Invoice | null) =>
  Boolean(
    invoice &&
    isValidAddress(invoice.address) &&
    (invoice.mode === 'SAME_AS_RECOMMENDED' ||
      invoice.address.type !== 'LGH' ||
      /^\d{4}$/.test(
        invoice.apartmentDetails?.number ??
          invoice.address.apartmentNumber ??
          '',
      )),
  );
