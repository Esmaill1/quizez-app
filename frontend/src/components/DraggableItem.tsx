import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { QuestionItem } from '../services/api';

interface DraggableItemProps {
  item: QuestionItem;
  index: number;
}

export default function DraggableItem({ item, index }: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    // Only use transition for other items moving out of the way, not the dragged item
    transition: isDragging ? undefined : (transition || 'transform 100ms ease'),
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-4 p-4 mb-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 ring-2 ring-indigo-500 z-50' : 'opacity-100'
      }`}
      {...attributes}
    >
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-full text-sm">
        {index + 1}
      </div>
      
      <div className="flex-grow flex items-center gap-4 min-w-0">
        {item.image_url && (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <img src={item.image_url} alt={item.text} className="w-full h-full object-cover" />
          </div>
        )}
        <span className="truncate text-gray-800 dark:text-gray-200 font-medium">
          {item.text}
        </span>
      </div>

      <div 
        {...listeners} 
        className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </div>
    </div>
  );
}