import { useTranslation } from 'react-i18next';
import { useLiveStock } from '@/hooks/useLiveStock';

interface Props {
  productId: string;
}

// FIX: Use threshold labels instead of exact stock numbers
// Showing "仅剩 3 件" reveals supply chain info and creates no urgency advantage.
// Threshold labels ("仅剩少量") achieve the same conversion goal without exposing data.
export function LiveInventory({ productId }: Props) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const { data: stock } = useLiveStock(productId);

  if (stock === undefined || stock === null) return null;
  if (stock === 0) return (
    <p className="text-sm font-body font-medium text-destructive">
      {lang === 'zh' ? '暂时缺货' : 'Out of Stock'}
    </p>
  );
  if (stock <= 3) return (
    <p className="text-sm font-body font-medium text-destructive animate-pulse">
      {lang === 'zh' ? '即将售罄，手慢无' : 'Almost gone — selling fast'}
    </p>
  );
  if (stock <= 10) return (
    <p className="text-sm font-body font-medium text-amber-600">
      {lang === 'zh' ? '仅剩少量库存' : 'Low stock'}
    </p>
  );
  return (
    <p className="text-sm font-body text-green-600">
      {lang === 'zh' ? '有货，可立即发货' : 'In Stock — Ready to Ship'}
    </p>
  );
}
