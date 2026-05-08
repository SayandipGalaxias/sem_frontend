import { TextStyle } from 'react-native';

const weights = {
    thin: 100,
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
} as const;

type Weight = keyof typeof weights;

export function interStyle(weight: Weight = 'regular'): TextStyle {
    return {
        fontFamily: 'Inter',
        ...({ fontVariationSettings: `'wght' ${weights[weight]}` } as any),
    };
}