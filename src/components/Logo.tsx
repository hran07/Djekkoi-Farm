import React from 'react';
import Svg, { Circle, G, Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ size = 38 }) => {
  const s = size / 38; // scale factor

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      accessibilityRole="image"
      accessibilityLabel="Logo Djekkoi Farm"
    >
      <Defs>
        {/* Deep teal backdrop gradient */}
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0e3d50" stopOpacity="1" />
          <Stop offset="1" stopColor="#071d27" stopOpacity="1" />
        </LinearGradient>
        {/* Body shimmer */}
        <LinearGradient id="bodyShim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#f8f2e6" stopOpacity="1" />
          <Stop offset="1" stopColor="#d8cbb4" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Rounded square backdrop */}
      <Path
        d="M6 0h26a6 6 0 0 1 6 6v26a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6V6a6 6 0 0 1 6-6z"
        fill="url(#bgGrad)"
      />

      {/* Subtle inner glow ring */}
      <Path
        d="M7 1h24a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6z"
        fill="none"
        stroke="#1e5a72"
        strokeWidth={0.8}
        opacity={0.5}
      />

      {/* === KOI FISH (facing left, swimming) === */}
      <G transform="translate(5, 10)">
        {/* Fork tail — two lobes */}
        <Path d="M21 9L28 3Q25.5 9 28 15Z" fill="#e8dfc8" opacity={0.8} />
        <Path d="M22 7.5L27 2Q24.5 7.5 27 9.5Z" fill="#e0432a" opacity={0.35} />
        <Path d="M22 10.5L27 16Q24.5 10.5 27 8.5Z" fill="#e0432a" opacity={0.35} />

        {/* Dorsal fin */}
        <Path
          d="M9 4.5C11 0 17 -1 20 4"
          fill="none"
          stroke="#e8dfc8"
          strokeWidth={2.2}
          strokeLinecap="round"
          opacity={0.7}
        />

        {/* Pectoral fin */}
        <Path d="M10 11C7 14.5 3.5 15.5 2 13C5 11 8.5 10 10 11Z" fill="#d4c9b2" opacity={0.6} />

        {/* Main body — smooth teardrop oval */}
        <Path
          d="M2 9C4.5 2 14 0.5 22 5C24 6.5 24.5 9 23.5 10.5C18 16 7 17 2 9Z"
          fill="url(#bodyShim)"
        />

        {/* Red Kohaku patches */}
        <Ellipse cx={10} cy={6.5} rx={5} ry={3} fill="#e0432a" opacity={0.85} />
        <Ellipse cx={17} cy={8.5} rx={3.5} ry={2.3} fill="#e0432a" opacity={0.75} />

        {/* Belly shimmer line */}
        <Path
          d="M5 10.5C10 9 17 9 22 10"
          fill="none"
          stroke="#ffffff"
          strokeWidth={0.7}
          opacity={0.2}
          strokeDasharray="2,3"
        />

        {/* Head snout */}
        <Ellipse cx={2} cy={9} rx={3} ry={2.6} fill="#ede4cf" />

        {/* Gill mark */}
        <Path
          d="M6 5.5C6.8 8 6.8 10 6 12.5"
          fill="none"
          stroke="#0e3d50"
          strokeWidth={0.7}
          opacity={0.25}
        />

        {/* Eye — dark with a white highlight */}
        <Circle cx={4.5} cy={7.5} r={1.6} fill="#0a0a14" />
        <Circle cx={4.5} cy={7.5} r={0.7} fill="#1a2a4a" />
        <Circle cx={3.9} cy={6.9} r={0.45} fill="#ffffff" opacity={0.9} />
      </G>

      {/* Accent dot — bottom-right corner brand mark */}
      <Circle cx={32} cy={32} r={2.8} fill="#e0432a" opacity={0.9} />
    </Svg>
  );
};

