import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Svg, { G, Path, Ellipse, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { FontNames } from '@/constants/theme';
import { rp } from '@/lib/format';

interface PondHeroProps {
  totalFish: number;
  totalVarieties: number;
  totalPonds: number;
  totalStockValue: number;
}

/**
 * SwimmingKoi — ikan bergerak dari KANAN ke KIRI
 * translateX: mulai dari 480 (kanan layar), berakhir di -160 (keluar kiri)
 */
const SwimmingKoi: React.FC<{
  duration: number;
  initialOffset: number;
  y: number;
  staticX: number;
  bodyColor: string;
  spotColor: string;
  finColor: string;
  patches: React.ReactNode;
  reduceMotion: boolean;
  fishScale?: number;
}> = ({ duration, initialOffset, y, staticX, bodyColor, spotColor, finColor, patches, reduceMotion, fishScale = 1 }) => {
  const durationMs = duration * 1000;
  const initialProgress = (((initialOffset % duration) + duration) % duration) / duration;
  const progress = useSharedValue(initialProgress);
  const tailAngle = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withRepeat(
      withTiming(initialProgress + 1, {
        duration: durationMs,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    tailAngle.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 380, easing: Easing.inOut(Easing.sin) }),
        withTiming(-8, { duration: 380, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [reduceMotion, durationMs, initialProgress, progress, tailAngle]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {
        transform: [
          { translateX: staticX },
          { translateY: y },
          { scaleX: fishScale },
          { scaleY: fishScale },
        ],
      };
    }
    // Kanan → Kiri: mulai dari 480 (kanan layar), berakhir di -160 (keluar kiri)
    const currentProgress = progress.value % 1;
    const translateX = interpolate(currentProgress, [0, 1], [480, -160]);
    return {
      transform: [
        { translateX },
        { translateY: y },
        { scaleX: fishScale },
        { scaleY: fishScale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.koiContainer, animatedStyle]}>
      {/* Ikan menghadap kiri (berenang ke kiri) */}
      <Svg width={110} height={40} viewBox="0 0 110 40">
        <Defs>
          <LinearGradient id={`bg_${bodyColor.replace('#','')}`} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={bodyColor} stopOpacity="0.5" />
            <Stop offset="0.5" stopColor={bodyColor} stopOpacity="1" />
            <Stop offset="1" stopColor={bodyColor} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {/* Ekor fork — dua lobe */}
        <Path d="M82 20L108 5Q100 20 108 35Z" fill={bodyColor} opacity={0.75} />
        <Path d="M84 18L106 4Q100 18 96 20Z" fill={spotColor} opacity={0.4} />
        <Path d="M84 22L106 36Q100 22 96 20Z" fill={spotColor} opacity={0.4} />

        {/* Sirip punggung (dorsal) */}
        <Path
          d="M42 14C46 4 66 2 76 12L72 18Z"
          fill={finColor}
          opacity={0.6}
        />

        {/* Sirip dada (pectoral) */}
        <Path
          d="M38 26C32 34 24 36 20 31C26 27 34 24 38 26Z"
          fill={finColor}
          opacity={0.55}
        />

        {/* Sirip perut (pelvic) */}
        <Path
          d="M60 30C54 38 46 39 43 34C50 30 57 28 60 30Z"
          fill={finColor}
          opacity={0.5}
        />

        {/* Tubuh utama — oval */}
        <Path
          d="M8 20C12 8 46 4 80 14C90 18 92 20 90 22C78 32 40 36 8 20Z"
          fill={`url(#bg_${bodyColor.replace('#','')})`}
        />

        {/* Pola warna */}
        {patches}

        {/* Garis kilap perut */}
        <Path
          d="M15 17C40 14 65 14 82 18"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          strokeDasharray="3,5"
          opacity={0.15}
        />

        {/* Garis insang */}
        <Path
          d="M22 13C24 18 24 22 22 27"
          fill="none"
          stroke="#000000"
          strokeWidth={0.8}
          opacity={0.18}
        />

        {/* Kepala */}
        <Ellipse cx={11} cy={20} rx={7} ry={6} fill={bodyColor} opacity={0.9} />
        {/* Moncong */}
        <Ellipse cx={5} cy={20} rx={3} ry={2.2} fill={bodyColor} />
        <Path d="M3.5 19C4 18.5 5.5 18.5 6.5 19" fill="none" stroke="#00000044" strokeWidth={0.6} />
        <Path d="M3.5 21C4 21.5 5.5 21.5 6.5 21" fill="none" stroke="#00000044" strokeWidth={0.6} />

        {/* Mata — realistis */}
        <Circle cx={17} cy={17} r={3.2} fill="#0a0a14" />
        <Circle cx={17} cy={17} r={1.8} fill="#1a1a3a" />
        {/* Kilap mata */}
        <Circle cx={15.8} cy={15.8} r={0.9} fill="#ffffff" opacity={0.85} />
      </Svg>
    </Animated.View>
  );
};

export const PondHero: React.FC<PondHeroProps> = ({
  totalFish,
  totalVarieties,
  totalPonds,
  totalStockValue,
}) => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.card}>
      {/* Background layer: air + cahaya + riak */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 360 232" preserveAspectRatio="xMidYMid slice">
          {/* Cahaya air samar (caustics) */}
          <G opacity={0.05}>
            <Path d="M50 0L75 232" stroke="#7ecfee" strokeWidth={22} />
            <Path d="M160 0L185 232" stroke="#7ecfee" strokeWidth={14} />
            <Path d="M280 0L305 232" stroke="#7ecfee" strokeWidth={18} />
          </G>
          {/* Riak air */}
          <G fill="none" stroke="#3b8796" strokeWidth={0.9} opacity={0.3}>
            <Ellipse cx={295} cy={55} rx={48} ry={11} />
            <Ellipse cx={295} cy={55} rx={28} ry={6} />
            <Ellipse cx={295} cy={55} rx={12} ry={3} />
            <Ellipse cx={58} cy={192} rx={40} ry={9} />
            <Ellipse cx={58} cy={192} rx={22} ry={5} />
            <Ellipse cx={58} cy={192} rx={9} ry={2.5} />
            <Ellipse cx={170} cy={215} rx={32} ry={7} />
            <Ellipse cx={170} cy={215} rx={16} ry={3.5} />
          </G>
          {/* Partikel gelembung air kecil */}
          <G fill="#7ecfee" opacity={0.12}>
            <Circle cx={120} cy={80} r={2} />
            <Circle cx={200} cy={140} r={1.5} />
            <Circle cx={80} cy={160} r={1} />
            <Circle cx={320} cy={100} r={1.8} />
            <Circle cx={250} cy={60} r={1.2} />
          </G>
        </Svg>

        {/* Koi 1 — Kohaku (putih-merah) */}
        <SwimmingKoi
          duration={46}
          initialOffset={0}
          y={55}
          staticX={60}
          bodyColor="#f0ebe0"
          spotColor="#e0432a"
          finColor="#e0432a"
          fishScale={1.05}
          reduceMotion={reduceMotion}
          patches={
            <>
              <Ellipse cx={38} cy={17} rx={16} ry={7} fill="#e0432a" opacity={0.88} />
              <Ellipse cx={62} cy={21} rx={12} ry={6} fill="#e0432a" opacity={0.82} />
              <Ellipse cx={76} cy={16} rx={7} ry={4} fill="#e0432a" opacity={0.7} />
            </>
          }
        />

        {/* Koi 2 — Ogon / Yamabuki (kuning emas) */}
        <SwimmingKoi
          duration={62}
          initialOffset={22}
          y={135}
          staticX={180}
          bodyColor="#e6b535"
          spotColor="#f7d56f"
          finColor="#c89020"
          fishScale={0.9}
          reduceMotion={reduceMotion}
          patches={
            <>
              <Ellipse cx={42} cy={18} rx={24} ry={5} fill="#f7d56f" opacity={0.65} />
              <Ellipse cx={66} cy={22} rx={14} ry={4} fill="#f5c530" opacity={0.5} />
            </>
          }
        />

        {/* Koi 3 — Showa (hitam-merah-putih) */}
        <SwimmingKoi
          duration={54}
          initialOffset={38}
          y={182}
          staticX={300}
          bodyColor="#1c1c22"
          spotColor="#e0432a"
          finColor="#3a3a44"
          fishScale={0.88}
          reduceMotion={reduceMotion}
          patches={
            <>
              <Ellipse cx={36} cy={17} rx={14} ry={6} fill="#e0432a" opacity={0.88} />
              <Ellipse cx={62} cy={21} rx={10} ry={5} fill="#e0432a" opacity={0.78} />
              <Ellipse cx={26} cy={20} rx={10} ry={5} fill="#f6f1e8" opacity={0.6} />
            </>
          }
        />
      </View>

      {/* Foreground Content */}
      <View style={styles.overlay}>
        <View>
          <Text style={styles.label}>🐟 Total ikan</Text>
          <Text style={styles.bigNumber}>{totalFish}</Text>
          <Text style={styles.subLabel}>
            {totalVarieties} jenis di {totalPonds} kolam
          </Text>
        </View>

        <View style={styles.foot}>
          <View>
            <Text style={styles.footLabel}>Nilai stok</Text>
            <Text style={styles.footValue}>{rp(totalStockValue)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#0b2f3b',
    minHeight: 232,
    marginBottom: 14,
    position: 'relative',
  },
  koiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'relative',
    padding: 22,
    justifyContent: 'space-between',
    minHeight: 232,
    zIndex: 2,
  },
  label: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    color: '#eaf6f6',
    opacity: 0.85,
    letterSpacing: 0.3,
  },
  bigNumber: {
    fontFamily: FontNames.sansBold,
    fontSize: 64,
    color: '#eaf6f6',
    lineHeight: 70,
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    color: '#eaf6f6',
    opacity: 0.75,
    marginTop: 2,
  },
  foot: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  footLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    color: '#eaf6f6',
    opacity: 0.7,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  footValue: {
    fontFamily: FontNames.sansBold,
    fontSize: 20,
    color: '#eaf6f6',
    lineHeight: 26,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
