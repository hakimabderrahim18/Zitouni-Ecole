import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  G,
  Path,
  Circle,
  Line,
} from 'react-native-svg';
import { theme } from '../theme/tokens';

interface SchoolLogoProps {
  size?: number;
  style?: ViewStyle;
  showText?: boolean;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ size = 64, style }) => {
  return (
    <View style={[{ width: size, height: size }, styles.container, style]}>
      <Svg viewBox="0 0 40 40" width="100%" height="100%">
        <Defs>
          <LinearGradient id="hebrBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#7B1E3A" />
            <Stop offset="50%" stopColor="#551125" />
            <Stop offset="100%" stopColor="#300612" />
          </LinearGradient>
          <LinearGradient id="hebrGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F7EED8" />
            <Stop offset="40%" stopColor="#C9A24D" />
            <Stop offset="100%" stopColor="#9E7B2B" />
          </LinearGradient>
        </Defs>

        {/* Badge Background */}
        <Rect width="40" height="40" rx="10" fill="url(#hebrBgGrad)" />
        <Rect
          x="0.75"
          y="0.75"
          width="38.5"
          height="38.5"
          rx="9.25"
          stroke="url(#hebrGoldGrad)"
          strokeOpacity="0.8"
          strokeWidth="1.5"
        />

        {/* Fountain Pen Nib / Plume d'encre (ريشة حبر) */}
        <G transform="translate(4, 2.5)">
          {/* Nib Outer Wings */}
          <Path
            d="M 16 3.5 C 18.5 5.5, 21.5 9, 23 12 C 24.2 14.5, 24.5 17.5, 24.5 20.5 L 20.5 20.5 L 18 28.5 L 16 33.5 L 14 28.5 L 11.5 20.5 L 7.5 20.5 C 7.5 17.5, 7.8 14.5, 9 12 C 10.5 9, 13.5 5.5, 16 3.5 Z"
            fill="url(#hebrGoldGrad)"
          />

          {/* Breather Hole & Ink Channel */}
          <Circle cx="16" cy="15" r="2.2" fill="#551125" />
          <Line
            x1="16"
            y1="17.2"
            x2="16"
            y2="33.5"
            stroke="#551125"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Letter 'ح' (حبر) stylized in the nib head */}
          <Path
            d="M 13 8.5 C 14.8 7.2 17.2 7.2 19 8.5 C 19 10 17.8 11.2 16 11.8 C 14.2 12.3 13.5 13.5 14.2 14.5"
            stroke="#551125"
            strokeWidth="1.3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Gold Ink Droplet at Nib Point */}
          <Circle cx="16" cy="34.8" r="1.1" fill="url(#hebrGoldGrad)" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2B2022',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
