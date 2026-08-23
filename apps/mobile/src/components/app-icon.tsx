import type { LucideIcon } from 'lucide-react-native';
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleUser,
  Clock3,
  Compass,
  IdCard,
  ImageIcon,
  KeyRound,
  List,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { colors } from '@/theme';

export const APP_ICON_NAMES = [
  'alert',
  'badge',
  'calendar',
  'camera',
  'car',
  'check',
  'chevron-left',
  'chevron-right',
  'clock',
  'compass',
  'id',
  'key',
  'list',
  'lock',
  'logout',
  'mail',
  'phone',
  'photo',
  'pin',
  'plus',
  'refresh',
  'search',
  'shield',
  'sparkle',
  'star',
  'user',
] as const;

export type AppIconName = (typeof APP_ICON_NAMES)[number];

const ICONS: Record<AppIconName, LucideIcon> = {
  alert: CircleAlert,
  badge: BadgeCheck,
  calendar: CalendarDays,
  camera: Camera,
  car: CarFront,
  check: Check,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock3,
  compass: Compass,
  id: IdCard,
  key: KeyRound,
  list: List,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  phone: Phone,
  photo: ImageIcon,
  pin: MapPin,
  plus: Plus,
  refresh: RefreshCw,
  search: Search,
  shield: ShieldCheck,
  sparkle: Sparkles,
  star: Star,
  user: CircleUser,
};

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function AppIcon({ name, size = 20, color = colors.text }: AppIconProps) {
  const Icon = ICONS[name];
  return <Icon size={size} color={color} strokeWidth={2} />;
}
