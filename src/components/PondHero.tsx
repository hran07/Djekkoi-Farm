import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Svg, { G, Path, Ellipse } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
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

const SwimmingKoi: React.FC<{
  duration: number; // in seconds
  initialOffset: number; // in seconds
  y: number;
  staticX: number;
  bodyColor: string;
  patches: React.ReactNode;
  reduceMotion: boolean;
}> = ({ duration, initialOffset, y, staticX, bodyColor, patches, reduceMotion }) => {
  const durationMs = duration * 1000;
  const initialProgress = (((initialOffset % duration) + duration) % duration) / duration;
  const progress = useSharedValue(initialProgress);

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
  }, [reduceMotion, durationMs, initialProgress, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return {
        transform: [{ translateX: staticX }, { translateY: y }],
      };
    }
    const currentProgress = progress.value % 1;
    const translateX = interpolate(currentProgress, [0, 1], [-120, 480]);
    return {
      transform: [{ translateX }, { translateY: y }],
    };
  });

  return (
    <Animated.View style={[styles.koiContainer, animatedStyle]}>
      <Svg width={96} height={30} viewBox="0 0 96 30">
        <Path d="M0 0C14-14 46-16 70-6C76-3 76 3 70 6C46 16 14 14 0 0Z" fill={bodyColor} />
        <Path d="M70 0L96-14Q90 0 96 14Z" fill={bodyColor} opacity={0.8} />
        {patches}
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
      {/* Animated Water & Koi Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" viewBox="0 0 360 232" preserveAspectRatio="xMidYMid slice">
          <G fill="none" stroke="#3b8796" strokeWidth={1} opacity={0.35}>
            <Ellipse cx={290} cy={60} rx={46} ry={12} />
            <Ellipse cx={290} cy={60} rx={26} ry={6.5} />
            <Ellipse cx={60} cy={190} rx={38} ry={10} />
            <Ellipse cx={60} cy={190} rx={18} ry={4.5} />
          </G>
        </Svg>

        {/* Koi 1 */}
        <SwimmingKoi
          duration={46}
          initialOffset={0}
          y={70}
          staticX={60}
          bodyColor="#f4efe6"
          reduceMotion={reduceMotion}
          patches={
            <>
              <Ellipse cx={24} cy={-2} rx={13} ry={6} fill="#e0432a" />
              <Ellipse cx={50} cy={3} rx={10} ry={5} fill="#e0432a" />
            </>
          }
        />

        {/* Koi 2 */}
        <SwimmingKoi
          duration={62}
          initialOffset={20}
          y={150}
          staticX={180}
          bodyColor="#e6b535"
          reduceMotion={reduceMotion}
          patches={<Ellipse cx={34} cy={-2} rx={22} ry={4} fill="#f7d56f" />}
        />

        {/* Koi 3 */}
        <SwimmingKoi
          duration={54}
          initialOffset={38}
          y={200}
          staticX={300}
          bodyColor="#1c1c22"
          reduceMotion={reduceMotion}
          patches={
            <>
              <Ellipse cx={26} cy={-1} rx={12} ry={5} fill="#e0432a" />
              <Ellipse cx={52} cy={3} rx={9} ry={4} fill="#f6f1e8" />
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
    padding: 20,
    justifyContent: 'space-between',
    minHeight: 232,
    zIndex: 2,
  },
  label: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    color: '#eaf6f6',
    opacity: 0.85,
  },
  bigNumber: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 64,
    color: '#eaf6f6',
    lineHeight: 68,
    letterSpacing: -1,
  },
  subLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    color: '#eaf6f6',
    opacity: 0.85,
    marginTop: 2,
  },
  foot: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 16,
  },
  footLabel: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    color: '#eaf6f6',
    opacity: 0.85,
  },
  footValue: {
    fontFamily: FontNames.serifBold,
    fontSize: 18,
    color: '#eaf6f6',
    lineHeight: 24,
    marginTop: 2,
  },
});
