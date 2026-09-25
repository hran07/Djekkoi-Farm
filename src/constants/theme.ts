export const ThemeColors = {
  light: {
    bg: '#e7eeed',
    surface: '#f9fbfa',
    surface2: '#dbe6e5',
    ink: '#0c2830',
    muted: '#557077',
    line: '#c9d8d7',
    accent: '#2a4494',
    onAccent: '#ffffff',
    accentSoft: '#dfe5f7',
    red: '#d8412b',
    redSoft: '#f9e1dc',
    gold: '#8f6a0e',
    goldSoft: '#f5e9c8',
    ok: '#237a52',
    okSoft: '#d9efe4',
    bad: '#b8332a',
    badSoft: '#f8dcd8',
  },
  dark: {
    bg: '#06181f',
    surface: '#0d2530',
    surface2: '#143441',
    ink: '#e4eff0',
    muted: '#8aa7ae',
    line: '#1d4150',
    accent: '#93aaff',
    onAccent: '#08132f',
    accentSoft: '#182a5a',
    red: '#ff7b62',
    redSoft: '#3d1f1b',
    gold: '#e6bb55',
    goldSoft: '#3a2f12',
    ok: '#5fd097',
    okSoft: '#123a29',
    bad: '#ff8579',
    badSoft: '#40201d',
  },
} as const;

export interface ThemeType {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  red: string;
  redSoft: string;
  gold: string;
  goldSoft: string;
  ok: string;
  okSoft: string;
  bad: string;
  badSoft: string;
}

export const FontNames = {
  sansRegular: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemiBold: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  serifMedium: 'ShipporiMinchoB1_500Medium',
  serifBold: 'ShipporiMinchoB1_700Bold',
  serifExtraBold: 'ShipporiMinchoB1_800ExtraBold',
};

export const GRADES = ['Champion', 'Premium', 'A', 'B', 'C'] as const;
export const SEX = ['Belum diketahui', 'Jantan', 'Betina'] as const;
export const COND = ['Sehat', 'Karantina', 'Pemulihan', 'Sakit'] as const;
export const PAY = ['Tunai', 'Transfer', 'QRIS', 'Lainnya'] as const;
export const VARS = [
  'Kohaku',
  'Sanke',
  'Showa',
  'Shiro Utsuri',
  'Asagi',
  'Shusui',
  'Tancho',
  'Bekko',
  'Ogon',
  'Yamabuki',
  'Goshiki',
  'Kujaku',
  'Chagoi',
  'Doitsu',
  'Kikusui',
  'Benigoi',
] as const;

export const LOW = 2;
export const STORAGE_KEY = 'djekkoi.v1';
