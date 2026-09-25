import React from 'react';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

export type TabIconName = 'dashboard' | 'ikan' | 'kolam' | 'penjualan' | 'riwayat';

interface TabIconProps {
  name: TabIconName;
  color: string;
  size?: number;
}

export const TabIcon: React.FC<TabIconProps> = ({ name, color, size = 23 }) => {
  switch (name) {
    case 'dashboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={3} y={3} width={7} height={9} rx={1.5} />
          <Rect x={14} y={3} width={7} height={5} rx={1.5} />
          <Rect x={14} y={12} width={7} height={9} rx={1.5} />
          <Rect x={3} y={16} width={7} height={5} rx={1.5} />
        </Svg>
      );

    case 'ikan':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2 12c3-5 8-7 12-5l3 2 5-3v12l-5-3-3 2c-4 2-9 0-12-5z" />
          <Circle cx={8} cy={11} r={0.8} fill={color} />
        </Svg>
      );

    case 'kolam':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4-2 6 0M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4-2 6 0" />
        </Svg>
      );

    case 'penjualan':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 12V4h8l10 10-8 8z" />
          <Circle cx={7.5} cy={8.5} r={1} fill={color} />
        </Svg>
      );

    case 'riwayat':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7v5l3 2" />
        </Svg>
      );

    default:
      return null;
  }
};
