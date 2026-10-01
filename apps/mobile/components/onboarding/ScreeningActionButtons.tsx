import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface ScreeningActionButtonsProps {
  onDownloadReportPress?: () => void;
  onBookConsultationPress?: () => void;
}

/**
 * BioPulse Bottom Dual Action Cards
 *
 * Implements:
 * - "Download Report" Card with honest mobile integration boundary (upcoming export)
 * - "Book Consultation" Card connected to clinical directory / dashboard navigation
 * - No fake doctor data invented
 */
export const ScreeningActionButtons: React.FC<ScreeningActionButtonsProps> = ({
  onDownloadReportPress,
  onBookConsultationPress,
}) => {
  const router = useRouter();
  const [downloadPending, setDownloadPending] = useState(false);

  const handleDownload = () => {
    if (onDownloadReportPress) {
      onDownloadReportPress();
      return;
    }

    setDownloadPending(true);
    Alert.alert(
      'Clinical Report Generation',
      'PDF report compilation is available on the BioPulse Web Portal and Clinical Dashboard. Mobile document export will be enabled in an upcoming release.',
      [
        {
          text: 'View in Dashboard',
          onPress: () => router.push('/(app)'),
        },
        {
          text: 'Dismiss',
          style: 'cancel',
          onPress: () => setDownloadPending(false),
        },
      ]
    );
  };

  const handleBookAppointment = () => {
    if (onBookConsultationPress) {
      onBookConsultationPress();
      return;
    }

    Alert.alert(
      'Specialist Consultation',
      'Would you like to navigate to the Clinical Directory in your Dashboard to schedule an appointment with a reproductive endocrinologist?',
      [
        {
          text: 'Open Clinical Dashboard',
          onPress: () => router.push('/(app)'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Download Report Card */}
      <View style={styles.actionCard}>
        <View style={styles.iconBox}>
          <Ionicons name="document-text-outline" size={18} color="#E0316A" />
        </View>

        <Text style={styles.cardTitle}>Download Report</Text>
        <Text style={styles.cardSubtitle}>
          Get a detailed PDF report of your screening result.
        </Text>

        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.7}
          onPress={handleDownload}
          accessibilityRole="button"
          accessibilityLabel="Download PDF Report"
        >
          <Ionicons name="download-outline" size={15} color="#E0316A" />
          <Text style={styles.outlineBtnText}>Download PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Book Consultation Card */}
      <View style={styles.actionCard}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar-outline" size={18} color="#E0316A" />
        </View>

        <Text style={styles.cardTitle}>Book Consultation</Text>
        <Text style={styles.cardSubtitle}>
          Discuss your result with a specialist.
        </Text>

        <TouchableOpacity
          style={styles.outlineBtn}
          activeOpacity={0.7}
          onPress={handleBookAppointment}
          accessibilityRole="button"
          accessibilityLabel="Book Appointment with a specialist"
        >
          <Ionicons name="calendar-clear-outline" size={15} color="#E0316A" />
          <Text style={styles.outlineBtnText}>Book Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F8DCE5',
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#0E1E36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E1E36',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    minHeight: 30,
    marginBottom: 12,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#E0316A',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
  },
  outlineBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E0316A',
  },
});
