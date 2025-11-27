import { View, StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import Colors from '@/constants/colors';

interface QRCodeProps {
  data: string;
  size?: number;
}

function generateQRMatrix(data: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  const addFinderPattern = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 ||
          c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          if (row + r < size && col + c < size) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(0, size - 7);
  addFinderPattern(size - 7, 0);

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  let seed = Math.abs(hash);
  const random = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!matrix[row][col]) {
        const isInFinderArea = (
          (row < 8 && col < 8) ||
          (row < 8 && col >= size - 8) ||
          (row >= size - 8 && col < 8)
        );
        
        const isInTimingPattern = row === 6 || col === 6;
        
        if (!isInFinderArea && !isInTimingPattern) {
          matrix[row][col] = random() > 0.5;
        }
      }
    }
  }

  return matrix;
}

export default function QRCode({ data, size = 200 }: QRCodeProps) {
  const matrix = generateQRMatrix(data);
  const moduleSize = size / matrix.length;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.qrWrapper}>
        <Svg width={size} height={size}>
          {matrix.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
              cell ? (
                <Rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex * moduleSize}
                  y={rowIndex * moduleSize}
                  width={moduleSize}
                  height={moduleSize}
                  fill={Colors.text}
                />
              ) : null
            )
          )}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrWrapper: {
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 8,
  },
});
