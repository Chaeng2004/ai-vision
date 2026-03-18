import { useState } from 'react';
import { Alert } from 'react-native';
import { ScanResult, DietaryRestriction } from '../types';
import { API_BASE } from '../constants';

interface UseScanReturn {
  isLoading: boolean;
  result: ScanResult | null;
  error: string | null;
  scan: (imageUri: string, restrictions: DietaryRestriction[]) => Promise<ScanResult | null>;
  reset: () => void;
}

export function useScan(): UseScanReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = async (
    imageUri: string,
    restrictions: DietaryRestriction[]
  ): Promise<ScanResult | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append('file', {
        uri: imageUri,
        name: 'label.jpg',
        type: 'image/jpeg',
      } as any);

      formData.append('restrictions', JSON.stringify(restrictions));

      const response = await fetch(`${API_BASE}/process-label`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Server error');
      }

      const data = await response.json();

      if (data.status !== 'success') {
        throw new Error(data.message || 'Processing failed');
      }

      const scanResult: ScanResult = {
        status: data.status_result,
        verdict_reason: data.verdict_reason,
        extracted_text: data.extracted_text,
        ingredients_detected: data.ingredients_detected,
        analysis: data.analysis,
        flagged_ingredients: data.flagged_ingredients,
        recommendation: data.recommendation,
        report: data.report,
      };

      setResult(scanResult);
      return scanResult;
    } catch (err: any) {
      const msg = err?.message ?? 'Something went wrong';
      setError(msg);
      Alert.alert('Scan Failed', msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsLoading(false);
  };

  return { isLoading, result, error, scan, reset };
}