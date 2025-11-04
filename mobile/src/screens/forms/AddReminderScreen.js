import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { remindersAPI, contactsAPI, loansAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddReminderScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      message: '',
      reminderType: 'general',
      scheduledDate: new Date(),
      priority: 'medium',
      sendMethod: 'sms',
      contactId: '',
      loanId: '',
      notes: '',
    },
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1000 }),
  });

  const { data: loansData } = useQuery({
    queryKey: ['loans'],
    queryFn: () => loansAPI.getLoans({ limit: 100 }),
  });

  const contactsList = contactsData?.data?.data || [];
  const loansList = loansData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: remindersAPI.createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['reminderStats'] });
      Alert.alert('Success', 'Reminder created successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create reminder');
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.title || !data.message || !data.scheduledDate) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const reminderData = {
        title: data.title,
        message: data.message,
        reminderType: data.reminderType,
        scheduledDate: data.scheduledDate.toISOString(),
        priority: data.priority,
        sendMethod: data.sendMethod,
        contactId: data.contactId || undefined,
        loanId: data.loanId || undefined,
        notes: data.notes || '',
      };

      createMutation.mutate(reminderData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save reminder');
    }
  };

  const reminderTypes = ['loan_payment', 'general', 'follow_up', 'birthday', 'appointment'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const sendMethods = ['sms', 'email', 'both', 'none'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Reminder</Text>

          <Controller
            control={control}
            name="title"
            rules={{ required: 'Title is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Title *"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                error={!!errors.title}
              />
            )}
          />
          {errors.title && (
            <HelperText type="error">{errors.title.message}</HelperText>
          )}

          <Controller
            control={control}
            name="message"
            rules={{ required: 'Message is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Message *"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
                error={!!errors.message}
              />
            )}
          />
          {errors.message && (
            <HelperText type="error">{errors.message.message}</HelperText>
          )}

          <Controller
            control={control}
            name="reminderType"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Reminder Type *</Text>
                <View style={styles.categoryContainer}>
                  {reminderTypes.map((type) => (
                    <Chip
                      key={type}
                      selected={value === type}
                      onPress={() => onChange(type)}
                      style={styles.categoryChip}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="scheduledDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Scheduled Date & Time *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  {value.toLocaleString()}
                </Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) onChange(selectedDate);
                    }}
                  />
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="priority"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Priority</Text>
                <View style={styles.statusContainer}>
                  {priorities.map((priority) => (
                    <Chip
                      key={priority}
                      selected={value === priority}
                      onPress={() => onChange(priority)}
                      style={styles.statusChip}
                    >
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="sendMethod"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Send Method</Text>
                <View style={styles.statusContainer}>
                  {sendMethods.map((method) => (
                    <Chip
                      key={method}
                      selected={value === method}
                      onPress={() => onChange(method)}
                      style={styles.statusChip}
                    >
                      {method.toUpperCase()}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Notes"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.input}
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={createMutation.isPending}
            buttonColor="#8b5cf6"
          >
            Create Reminder
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    marginRight: 8,
  },
  dateButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

