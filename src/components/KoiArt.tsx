import React, { useId } from 'react';
import Svg, { Rect, G, Path, Ellipse, Circle, Defs, ClipPath } from 'react-native-svg';
import { StyleProp, ViewStyle } from 'react-native';

interface KoiArtProps {
  varietas?: string;
  style?: StyleProp<ViewStyle>;
  width?: number | string;
  height?: number | string;
}

export const KoiArt: React.FC<KoiArtProps> = ({ varietas = '', style, width = '100%', height = '100%' }) => {
  const rawId = useId();
  const clipId = `koi_clip_${rawId.replace(/:/g, '_')}`;

  const v = String(varietas || '').toLowerCase();
  let base = '#f0883a';
  const red = '#e0432a';
  const blk = '#1c1c22';
  const wht = '#f6f1e8';

  let patternElements: React.ReactNode = null;

  if (v.includes('tancho')) {
    base = wht;
    patternElements = <Ellipse cx={52} cy={68} rx={9} ry={9} fill={red} />;
  } else if (v.includes('kohaku')) {
    base = wht;
    patternElements = (
      <>
        <Ellipse cx={70} cy={60} rx={20} ry={9} fill={red} />
        <Ellipse cx={102} cy={74} rx={18} ry={8} fill={red} />
        <Ellipse cx={126} cy={66} rx={10} ry={6} fill={red} />
      </>
    );
  } else if (v.includes('sanke')) {
    base = wht;
    patternElements = (
      <>
        <Ellipse cx={68} cy={60} rx={18} ry={9} fill={red} />
        <Ellipse cx={104} cy={74} rx={16} ry={8} fill={red} />
        <Ellipse cx={90} cy={62} rx={6} ry={4} fill={blk} />
        <Ellipse cx={122} cy={68} rx={6} ry={4} fill={blk} />
      </>
    );
  } else if (v.includes('showa')) {
    base = blk;
    patternElements = (
      <>
        <Ellipse cx={70} cy={62} rx={18} ry={9} fill={red} />
        <Ellipse cx={108} cy={74} rx={16} ry={8} fill={red} />
        <Ellipse cx={52} cy={62} rx={10} ry={7} fill={wht} />
      </>
    );
  } else if (v.includes('utsuri')) {
    base = blk;
    patternElements = (
      <>
        <Ellipse cx={74} cy={62} rx={16} ry={8} fill={wht} />
        <Ellipse cx={112} cy={74} rx={14} ry={7} fill={wht} />
        <Ellipse cx={48} cy={66} rx={8} ry={6} fill={wht} />
      </>
    );
  } else if (v.includes('asagi')) {
    base = '#7c9db8';
    patternElements = (
      <>
        <Ellipse cx={80} cy={84} rx={26} ry={6} fill="#e56a3a" />
        <Ellipse cx={112} cy={82} rx={14} ry={5} fill="#e56a3a" />
      </>
    );
  } else if (v.includes('shusui')) {
    base = '#8eb0c9';
    patternElements = (
      <>
        <Ellipse cx={84} cy={80} rx={30} ry={7} fill={red} />
        <Ellipse cx={56} cy={60} rx={8} ry={5} fill="#6d92b0" />
      </>
    );
  } else if (v.includes('ogon') || v.includes('yamabuki')) {
    base = '#e6b535';
    patternElements = <Ellipse cx={80} cy={60} rx={30} ry={6} fill="#f7d56f" />;
  } else if (v.includes('bekko')) {
    base = '#e8a23a';
    patternElements = (
      <>
        <Ellipse cx={76} cy={62} rx={9} ry={6} fill={blk} />
        <Ellipse cx={108} cy={72} rx={8} ry={6} fill={blk} />
      </>
    );
  }

  const bodyPath = 'M30 70C45 48 100 44 140 62C150 66 152 74 140 78C100 96 45 92 30 70Z';

  return (
    <Svg viewBox="0 0 200 140" style={style} width={width} height={height}>
      <Rect width={200} height={140} fill="#0f3a47" />
      <G fill="none" stroke="#2c6a78" strokeWidth={1.2} opacity={0.5}>
        <Ellipse cx={150} cy={30} rx={26} ry={8} />
        <Ellipse cx={150} cy={30} rx={14} ry={4} />
        <Ellipse cx={30} cy={115} rx={22} ry={6} />
      </G>

      <Defs>
        <ClipPath id={clipId}>
          <Path d={bodyPath} />
        </ClipPath>
      </Defs>

      {/* Tail */}
      <Path d="M140 70L182 46Q172 70 182 94Z" fill={base} opacity={0.85} />

      {/* Fins */}
      <G transform="rotate(-25, 78, 48)">
        <Ellipse cx={78} cy={48} rx={15} ry={5} fill={base} opacity={0.7} />
      </G>
      <G transform="rotate(25, 78, 92)">
        <Ellipse cx={78} cy={92} rx={15} ry={5} fill={base} opacity={0.7} />
      </G>

      {/* Body */}
      <Path d={bodyPath} fill={base} />

      {/* Pattern clipped to body */}
      <G clipPath={`url(#${clipId})`}>{patternElements}</G>

      {/* Eye */}
      <Circle cx={46} cy={64} r={2.4} fill="#111111" />
    </Svg>
  );
};
