import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function CitationChip({ label, toId }: { label: number; toId: string }) {
  return (
    <Link to={`/references#ref-${toId}`} className="inline-block">
      <Badge variant="secondary" className="ml-1 align-middle">[{label}]</Badge>
    </Link>
  );
}

