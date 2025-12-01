/**
 * ContentList Component
 * Grid of content cards
 */

'use client';

import { ContentCard } from './ContentCard';
import type { Content } from '@/lib/api/content';

interface ContentListProps {
  contents: Content[];
  total: number;
}

export function ContentList({ contents, total }: ContentListProps) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          All Content ({total})
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {contents.map((content) => (
          <ContentCard key={content.id} content={content} />
        ))}
      </div>
    </div>
  );
}
