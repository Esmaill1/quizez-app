import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionItem } from '../services/api';
import './DraggableItem.css';

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
    opacity: isDragging ? 0.95 : 1,
    zIndex: isDragging ? 1000 : 'auto',
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-item ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="item-position">{index + 1}</div>
      <div className="item-content">
        <span className="item-text">{item.text}</span>
      </div>
      <div className="drag-handle">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
        </svg>
      </div>
    </div>
  );
}
