"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Address } from '@/types';
import type { MockAddressResult } from '@/types/dev';
import { fetchApartmentNumbers, formatAddress, searchAddresses } from '@/services/addressService';

type AddressLookupState = {
  query: string;
  status: 'loading' | 'success' | 'error';
  results: Address[];
  error: string | null;
};

export const useAddressLookup = (options: {
  query: string;
  selectedAddress: Address | null;
  enabled?: boolean;
  mockResult?: MockAddressResult;
  debounceMs?: number;
}) => {
  const {
    query,
    selectedAddress,
    enabled = true,
    mockResult,
    debounceMs = 300,
  } = options;
  const [request, setRequest] = useState<AddressLookupState | null>(null);
  const hasSelectedQuery = Boolean(
    selectedAddress && query === formatAddress(selectedAddress)
  );
  const shouldSearch = enabled && query.length >= 2 && !hasSelectedQuery;

  useEffect(() => {
    if (!shouldSearch) return;

    let isActive = true;
    const runSearch = async () => {
      setRequest({ query, status: 'loading', results: [], error: null });
      try {
        const results = await searchAddresses(query, mockResult);
        if (!isActive) return;
        setRequest({ query, status: 'success', results, error: null });
      } catch {
        if (!isActive) return;
        setRequest({
          query,
          status: 'error',
          results: [],
          error: 'Det gick inte att hämta adresser just nu.',
        });
      }
    };

    const timer = window.setTimeout(runSearch, debounceMs);
    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [debounceMs, mockResult, query, shouldSearch]);

  const currentRequest = shouldSearch && request?.query === query ? request : null;

  return {
    results: currentRequest?.results ?? [],
    isLoading: currentRequest?.status === 'loading',
    hasSearched: currentRequest?.status === 'success' || currentRequest?.status === 'error',
    showList: Boolean(currentRequest),
    error: currentRequest?.error ?? null,
  };
};

type ApartmentRequestState = {
  addressKey: string;
  status: 'loading' | 'success' | 'error';
  numbers: string[];
};

const getAddressKey = (address: Address) => [
  address.street,
  address.number,
  address.postalCode,
  address.city,
].join('|');

export const useApartmentNumbers = (
  address: Address | null,
  enabled = true
) => {
  const [request, setRequest] = useState<ApartmentRequestState | null>(null);
  const shouldLoad = enabled && address?.type === 'LGH';
  const addressKey = address ? getAddressKey(address) : null;

  useEffect(() => {
    if (!shouldLoad || !address || !addressKey) return;

    let isActive = true;
    const load = async () => {
      setRequest({ addressKey, status: 'loading', numbers: [] });
      try {
        const numbers = await fetchApartmentNumbers(address);
        if (!isActive) return;
        setRequest({ addressKey, status: 'success', numbers });
      } catch {
        if (!isActive) return;
        setRequest({ addressKey, status: 'error', numbers: [] });
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [address, addressKey, shouldLoad]);

  const currentRequest = shouldLoad && request?.addressKey === addressKey ? request : null;
  return {
    apartmentNumbers: currentRequest?.numbers ?? [],
    isLoading: currentRequest?.status === 'loading',
    hasError: currentRequest?.status === 'error',
  };
};

export const useGroupedApartmentNumbers = (numbers: string[]) => useMemo(
  () => Object.entries(
    numbers.reduce((groups, apartmentNumber) => {
      const floor = apartmentNumber.substring(0, 2);
      if (!groups[floor]) groups[floor] = [];
      groups[floor].push(apartmentNumber);
      return groups;
    }, {} as Record<string, string[]>)
  )
    .sort(([firstFloor], [secondFloor]) => secondFloor.localeCompare(firstFloor))
    .map(([floor, floorNumbers]) => [floor, [...floorNumbers].sort()] as const),
  [numbers]
);
