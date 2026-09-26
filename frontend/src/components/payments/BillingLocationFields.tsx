"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import SearchableSelect, { type Option } from '@/components/ui/SearchableSelect';

type BillingLocationFieldsProps = {
  state: string;
  city: string;
  onChange: (location: { state: string; city: string }) => void;
  onError?: (message: string | null) => void;
};

export default function BillingLocationFields({ state, city, onChange, onError }: BillingLocationFieldsProps) {
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [stateId, setStateId] = useState('');
  const [cityId, setCityId] = useState('');

  useEffect(() => {
    let mounted = true;
    const loadStates = async () => {
      try {
        const countries = await api.get<Option[]>('/locations/countries');
        const india = (countries.data || []).find((item) => item.name.toLowerCase() === 'india');
        if (!india) return;
        const response = await api.get<Option[]>(`/locations/states/${india.id}`);
        if (!mounted) return;
        const nextStates = response.data || [];
        setStates(nextStates);
        const selected = nextStates.find((item) => item.name.toLowerCase() === state.trim().toLowerCase());
        if (selected) {
          setStateId(String(selected.id));
          const cityResponse = await api.get<Option[]>(`/locations/cities/${selected.id}`);
          if (!mounted) return;
          const nextCities = cityResponse.data || [];
          setCities(nextCities);
          const selectedCity = nextCities.find((item) => item.name.toLowerCase() === city.trim().toLowerCase());
          if (selectedCity) setCityId(String(selectedCity.id));
        }
      } catch {
        if (mounted) onError?.('Unable to load billing locations. Please try again.');
      }
    };
    void loadStates();
    return () => { mounted = false; };
  }, [city, onError, state]);

  const handleStateChange = async (option: Option) => {
    setStateId(String(option.id));
    setCityId('');
    setCities([]);
    onChange({ state: option.name, city: '' });
    try {
      const response = await api.get<Option[]>(`/locations/cities/${option.id}`);
      setCities(response.data || []);
    } catch {
      onError?.('Unable to load cities for the selected state.');
    }
  };

  const handleCityChange = (option: Option) => {
    setCityId(String(option.id));
    onChange({ state, city: option.name });
  };

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="mb-3">
        <p className="text-sm font-bold text-gray-900">Billing location</p>
        <p className="mt-1 text-xs text-gray-600">Select your state and city before continuing to payment.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">State *</label>
          <SearchableSelect options={states} value={stateId || state} displayValue={state} onChange={(option) => void handleStateChange(option)} placeholder="Select state" className="bg-white" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-gray-700">City *</label>
          <SearchableSelect options={stateId ? cities : []} value={cityId || city} displayValue={city} onChange={handleCityChange} placeholder={stateId ? 'Select city' : 'Select state first'} disabled={!stateId} className="bg-white" />
        </div>
      </div>
    </div>
  );
}
