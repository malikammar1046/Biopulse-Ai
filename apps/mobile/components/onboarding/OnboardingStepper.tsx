import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BioPulseColors } from '../../constants/Colors';

export interface StepperStep {
  id: number;
  label: string;
}

export interface OnboardingStepperProps {
  currentStep?: number; // 1-indexed (1..4)
  steps?: StepperStep[];
  accentColor?: string;
}

const DEFAULT_STEPS: StepperStep[] = [
  { id: 1, label: 'Choose Path' },
  { id: 2, label: 'Basic Info' },
  { id: 3, label: 'Health Details' },
  { id: 4, label: 'Complete' },
];

/**
 * BioPulse Onboarding Progress Stepper
 *
 * Implements:
 * - 4 horizontal progressive steps
 * - Numbered badge indicators (active pink/teal, inactive gray)
 * - Connecting divider tracks between steps
 * - Pathway-neutral step labels
 */
export const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
  currentStep = 1,
  steps = DEFAULT_STEPS,
  accentColor = BioPulseColors.femaleAccent,
}) => {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${steps.length}: ${steps[currentStep - 1]?.label || ''}`}
    >
      <View style={styles.trackRow}>
        {steps.map((step, index) => {
          const stepNumber = step.id;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={`step-${step.id}`}>
              {/* Step Item (Circle + Label) */}
              <View style={[styles.stepColumn, steps.length > 4 && styles.stepColumnCompact]}>
                <View
                  style={[
                    styles.circle,
                    isActive && [styles.activeCircle, { backgroundColor: accentColor }],
                    isCompleted && [styles.completedCircle, { backgroundColor: accentColor }],
                  ]}
                >
                  <Text
                    style={[
                      styles.circleNumber,
                      (isActive || isCompleted) && styles.activeCircleNumber,
                    ]}
                  >
                    {isCompleted ? '✓' : stepNumber}
                  </Text>
                </View>

                <Text
                  numberOfLines={1}
                  style={[
                    styles.stepLabel,
                    steps.length > 4 && styles.stepLabelCompact,
                    isActive && [styles.activeStepLabel, { color: accentColor }],
                    isCompleted && [styles.completedStepLabel, { color: accentColor }],
                  ]}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting Line between steps */}
              {!isLast && (
                <View
                  style={[
                    styles.connectorLine,
                    steps.length > 4 && styles.connectorLineCompact,
                    isCompleted ? { backgroundColor: accentColor } : styles.inactiveConnector,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
    marginBottom: 8,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stepColumn: {
    alignItems: 'center',
    width: 72,
    zIndex: 2,
  },
  stepColumnCompact: {
    width: 60,
  },
  stepLabelCompact: {
    fontSize: 10,
  },
  connectorLineCompact: {
    marginHorizontal: -12,
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeCircle: {
    borderColor: 'transparent',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  completedCircle: {
    borderColor: 'transparent',
  },
  circleNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activeCircleNumber: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  activeStepLabel: {
    fontWeight: '700',
  },
  completedStepLabel: {
    color: '#475569',
    fontWeight: '600',
  },
  connectorLine: {
    flex: 1,
    height: 1.5,
    marginTop: 12,
    marginHorizontal: -8,
    zIndex: 1,
  },
  inactiveConnector: {
    backgroundColor: '#E2E8F0',
  },
});
