"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { lookupCompany, CompanyLookupResult } from '@/services/companyService';
import styles from './CompanySearch.module.css';

interface CompanySearchProps {
  onCompanyFound: (company: CompanyLookupResult) => void;
  onBack: () => void;
}

export const CompanySearch = ({ onCompanyFound, onBack }: CompanySearchProps) => {
  const [orgNr, setOrgNr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
  const formatOrgNr = (value: string) => {
    // Permissive input: Allow users to type as they wish, backend handles validation.
    return value;
  };
  */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgNr(e.target.value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orgNr.length < 2) return; // Very basic check

    setIsLoading(true);
    setError(null);

    try {
      const result = await lookupCompany(orgNr);
      onCompanyFound(result);
    } catch (err) {
      setError('Vi kunde tyvärr inte hitta företaget. Kontrollera numret och försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Hämta företagsuppgifter</h2>
      <p className={styles.description}>
        Ange organisationsnummer.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Organisationsnummer"
          value={orgNr}
          onChange={handleChange}
          placeholder="556XXX-XXXX"
          required
          maxLength={20}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onBack}>
            Tillbaka
          </Button>
          <Button type="submit" disabled={orgNr.length < 2 || isLoading}>
            {isLoading ? 'Söker...' : 'Hämta uppgifter'}
          </Button>
        </div>
      </form>
    </div>
  );
};
