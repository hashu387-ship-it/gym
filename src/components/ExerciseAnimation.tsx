/**
 * Looping SVG exercise demonstrations grouped by movement pattern.
 *
 * Each pattern is a small, calm animation driven by reanimated. Coordinates are
 * animated as plain numeric SVG props (not transform strings) so it behaves the
 * same on web and native. Renders entirely on-device with no network or key.
 */

import React, { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';
import type { AnimationPattern } from '@/data/exercisePatterns';

const ALine = Animated.createAnimatedComponent(Line);
const ACircle = Animated.createAnimatedComponent(Circle);
const ARect = Animated.createAnimatedComponent(Rect);

function lerp(a: number, b: number, t: number) {
  'worklet';
  return a + (b - a) * t;
}

/** A 0..1 value that loops, oscillating back and forth (or forward-only). */
function useLoop(duration: number, reverse = true): SharedValue<number> {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = 0;
    p.value = withRepeat(
      withTiming(1, { duration, easing: reverse ? Easing.inOut(Easing.ease) : Easing.linear }),
      -1,
      reverse,
    );
    return () => cancelAnimation(p);
  }, [duration, reverse, p]);
  return p;
}

interface PatternProps {
  fig: string;
  imp: string;
}

const STROKE = 3;
const baseLine = (fig: string, x1: number, y1: number, x2: number, y2: number) => (
  <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
);

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 80">
      {children}
    </Svg>
  );
}

function PressAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1300);
  const bar = useAnimatedProps(() => ({ y: lerp(42, 20, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 30, 72, 70, 72)}
      <Circle cx={50} cy={50} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 50, 56, 50, 68)}
      <ARect animatedProps={bar} x={32} width={36} height={5} rx={2.5} fill={imp} />
    </Frame>
  );
}

function PullAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1300);
  const bar = useAnimatedProps(() => ({ y: lerp(14, 32, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 30, 74, 70, 74)}
      <Circle cx={50} cy={42} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 50, 48, 50, 66)}
      <ARect animatedProps={bar} x={30} width={40} height={5} rx={2.5} fill={imp} />
    </Frame>
  );
}

function RowAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1200);
  const handle = useAnimatedProps(() => ({ x: lerp(64, 38, p.value) }));
  const cable = useAnimatedProps(() => ({ x1: lerp(67, 41, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 16, 70, 40, 70)}
      <Circle cx={24} cy={34} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 24, 40, 24, 60)}
      <ALine animatedProps={cable} y1={47} x2={92} y2={30} stroke={fig} strokeWidth={1.5} />
      <ARect animatedProps={handle} y={40} width={5} height={14} rx={2.5} fill={imp} />
    </Frame>
  );
}

function LateralAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1400);
  const lArm = useAnimatedProps(() => ({ x2: lerp(43, 26, p.value), y2: lerp(48, 30, p.value) }));
  const rArm = useAnimatedProps(() => ({ x2: lerp(57, 74, p.value), y2: lerp(48, 30, p.value) }));
  const lBell = useAnimatedProps(() => ({ cx: lerp(43, 26, p.value), cy: lerp(48, 30, p.value) }));
  const rBell = useAnimatedProps(() => ({ cx: lerp(57, 74, p.value), cy: lerp(48, 30, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 36, 72, 64, 72)}
      <Circle cx={50} cy={22} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 50, 28, 50, 48)}
      <ALine animatedProps={lArm} x1={47} y1={32} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ALine animatedProps={rArm} x1={53} y1={32} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ACircle animatedProps={lBell} r={4} fill={imp} />
      <ACircle animatedProps={rBell} r={4} fill={imp} />
    </Frame>
  );
}

function CurlAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1200);
  const forearm = useAnimatedProps(() => ({ x2: lerp(40, 52, p.value), y2: lerp(64, 36, p.value) }));
  const bell = useAnimatedProps(() => ({ cx: lerp(40, 52, p.value), cy: lerp(64, 36, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 30, 74, 60, 74)}
      <Circle cx={42} cy={22} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 42, 28, 40, 50)}
      {baseLine(fig, 40, 50, 38, 48)}
      <ALine animatedProps={forearm} x1={38} y1={48} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ACircle animatedProps={bell} r={4} fill={imp} />
    </Frame>
  );
}

function SquatAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1500);
  const bar = useAnimatedProps(() => ({ y: lerp(28, 40, p.value) }));
  const torso = useAnimatedProps(() => ({ y1: lerp(33, 45, p.value) }));
  const head = useAnimatedProps(() => ({ cy: lerp(25, 37, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 34, 72, 66, 72)}
      {baseLine(fig, 50, 60, 42, 72)}
      {baseLine(fig, 50, 60, 58, 72)}
      <ALine animatedProps={torso} x1={50} x2={50} y2={60} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ACircle animatedProps={head} cx={50} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      <ARect animatedProps={bar} x={30} width={40} height={5} rx={2.5} fill={imp} />
    </Frame>
  );
}

function HingeAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1500);
  const torso = useAnimatedProps(() => ({ x2: lerp(50, 70, p.value), y2: lerp(28, 44, p.value) }));
  const head = useAnimatedProps(() => ({ cx: lerp(50, 73, p.value), cy: lerp(22, 42, p.value) }));
  const bar = useAnimatedProps(() => ({ x: lerp(44, 67, p.value), y: lerp(40, 56, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 38, 74, 62, 74)}
      {baseLine(fig, 50, 74, 50, 54)}
      <ALine animatedProps={torso} x1={50} y1={54} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ACircle animatedProps={head} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      <ARect animatedProps={bar} width={14} height={4} rx={2} fill={imp} />
    </Frame>
  );
}

function LegExtensionAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1300);
  const shin = useAnimatedProps(() => ({ x2: lerp(50, 72, p.value), y2: lerp(70, 48, p.value) }));
  const foot = useAnimatedProps(() => ({ cx: lerp(50, 72, p.value), cy: lerp(70, 48, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 18, 56, 50, 56)}
      <Circle cx={26} cy={28} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 26, 34, 26, 52)}
      {baseLine(fig, 26, 52, 50, 52)}
      <ALine animatedProps={shin} x1={50} y1={52} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ACircle animatedProps={foot} r={3.5} fill={imp} />
    </Frame>
  );
}

function CalfAnim({ fig, imp }: PatternProps) {
  const p = useLoop(900);
  const lHeel = useAnimatedProps(() => ({ cy: lerp(72, 64, p.value) }));
  const rHeel = useAnimatedProps(() => ({ cy: lerp(72, 64, p.value) }));
  const head = useAnimatedProps(() => ({ cy: lerp(30, 26, p.value) }));
  const torso = useAnimatedProps(() => ({ y1: lerp(36, 32, p.value) }));
  return (
    <Frame>
      {baseLine(fig, 34, 74, 66, 74)}
      {baseLine(fig, 44, 72, 46, 50)}
      {baseLine(fig, 56, 72, 54, 50)}
      <ALine animatedProps={torso} x1={50} x2={50} y2={50} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ACircle animatedProps={head} cx={50} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      <ACircle animatedProps={lHeel} cx={44} r={3} fill={imp} />
      <ACircle animatedProps={rHeel} cx={56} r={3} fill={imp} />
    </Frame>
  );
}

function CardioAnim({ fig, imp }: PatternProps) {
  const p = useLoop(1400, false);
  const pedalA = useAnimatedProps(() => ({
    cx: 46 + 12 * Math.cos(2 * Math.PI * p.value),
    cy: 56 + 12 * Math.sin(2 * Math.PI * p.value),
  }));
  const pedalB = useAnimatedProps(() => ({
    cx: 46 + 12 * Math.cos(2 * Math.PI * p.value + Math.PI),
    cy: 56 + 12 * Math.sin(2 * Math.PI * p.value + Math.PI),
  }));
  return (
    <Frame>
      <Circle cx={46} cy={56} r={12} stroke={fig} strokeWidth={2} fill="none" />
      <Circle cx={46} cy={56} r={2.5} fill={fig} />
      <Circle cx={50} cy={24} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 50, 30, 47, 44)}
      <ACircle animatedProps={pedalA} r={4} fill={imp} />
      <ACircle animatedProps={pedalB} r={4} fill={imp} />
    </Frame>
  );
}

function MobilityAnim({ fig, imp }: PatternProps) {
  const p = useLoop(2200, false);
  const lArm = useAnimatedProps(() => ({
    x2: 44 + 14 * Math.cos(2 * Math.PI * p.value),
    y2: 34 + 14 * Math.sin(2 * Math.PI * p.value),
  }));
  const rArm = useAnimatedProps(() => ({
    x2: 56 + 14 * Math.cos(2 * Math.PI * p.value + Math.PI),
    y2: 34 + 14 * Math.sin(2 * Math.PI * p.value + Math.PI),
  }));
  const lHand = useAnimatedProps(() => ({
    cx: 44 + 14 * Math.cos(2 * Math.PI * p.value),
    cy: 34 + 14 * Math.sin(2 * Math.PI * p.value),
  }));
  const rHand = useAnimatedProps(() => ({
    cx: 56 + 14 * Math.cos(2 * Math.PI * p.value + Math.PI),
    cy: 34 + 14 * Math.sin(2 * Math.PI * p.value + Math.PI),
  }));
  return (
    <Frame>
      {baseLine(fig, 36, 74, 64, 74)}
      <Circle cx={50} cy={22} r={6} stroke={fig} strokeWidth={STROKE} fill="none" />
      {baseLine(fig, 50, 28, 50, 52)}
      <ALine animatedProps={lArm} x1={44} y1={34} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ALine animatedProps={rArm} x1={56} y1={34} stroke={fig} strokeWidth={STROKE} strokeLinecap="round" />
      <ACircle animatedProps={lHand} r={3.5} fill={imp} />
      <ACircle animatedProps={rHand} r={3.5} fill={imp} />
    </Frame>
  );
}

const RENDERERS: Record<AnimationPattern, React.ComponentType<PatternProps>> = {
  press: PressAnim,
  pull: PullAnim,
  row: RowAnim,
  lateralRaise: LateralAnim,
  curl: CurlAnim,
  squat: SquatAnim,
  hinge: HingeAnim,
  legExtension: LegExtensionAnim,
  calf: CalfAnim,
  cardio: CardioAnim,
  mobility: MobilityAnim,
};

export function ExerciseAnimation({ pattern }: { pattern: AnimationPattern }) {
  const theme = useTheme();
  const Renderer = RENDERERS[pattern];
  return <Renderer fig={theme.textSecondary} imp={theme.primary} />;
}
