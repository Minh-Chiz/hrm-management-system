import { MaterialIcons } from '@expo/vector-icons';

export interface RequestTypeItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

export const REQUEST_TYPES: RequestTypeItem[] = [
  { id: 'leave', label: 'Nghỉ phép', icon: 'event-busy' },
  { id: 'ot', label: 'Làm thêm giờ (OT)', icon: 'more-time' },
  { id: 'makeup', label: 'Chấm công bù', icon: 'edit-calendar' },
];
