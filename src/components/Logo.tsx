import React from 'react';
import Svg, { Rect, G, Path, Ellipse } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 38 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 38 38" accessibilityRole="image" accessibilityLabel="Logo Djekkoi Farm">
      <Rect width={38} height={38} rx={11} fill="#0b2f3b" />
      <G transform="translate(6, 12)">
        <Path d="M0 7C4 1 14-1 20 3c1 .7 1 1.7 0 2.4C14 9.5 4 13 0 7Z" fill="#f4efe6" />
        <Path d="M19 5 26 0Q24 5 26 10Z" fill="#f4efe6" />
        <Ellipse cx={8} cy={5} rx={4} ry={2.4} fill="#e0432a" />
        <Ellipse cx={14} cy={6.6} rx={3} ry={1.8} fill="#e0432a" />
      </G>
    </Svg>
  );
};
