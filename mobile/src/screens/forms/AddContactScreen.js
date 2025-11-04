import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';

export default function AddContactScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      type: 'debtor',
      address: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: contactsAPI.createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      navigation.goBack();
    },
  });

  const onSubmit = async (data) => {
    createMutation.mutate(data);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>
            Add New Contact
          </Text>

          <Controller
            control={control}
            name="name"
            rules={{ required: 'Name is required' }}
            render={({ field: { onChange, value } }) => (
              <View>
                <TextInput
                  label="Name *"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.name}
                />
                {errors.name && (
                  <HelperText type="error">{errors.name.message}</HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="phone"
            rules={{ required: 'Phone is required' }}
            render={({ field: { onChange, value } }) => (
              <View>
                <TextInput
                  label="Phone *"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                  error={!!errors.phone}
                />
                {errors.phone && (
                  <HelperText type="error">{errors.phone.message}</HelperText>
                )}
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Email"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="type"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Type *</Text>
                <SegmentedButtons
                  value={value}
                  onValueChange={onChange}
                  buttons={[
                    { value: 'debtor', label: 'Debtor' },
                    { value: 'creditor', label: 'Creditor' },
                    { value: 'partner', label: 'Partner' },
                  ]}
                  style={styles.segmentedButtons}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="address"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Address"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
              />
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
            loading={createMutation.isLoading}
            style={styles.submitButton}
          >
            Create Contact
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
});

