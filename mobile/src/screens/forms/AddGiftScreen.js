import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { giftsAPI, contactsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddGiftScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      giftType: 'given',
      category: 'money',
      amount: '',
      currency: 'FRW',
      quantity: '1',
      giftDate: new Date(),
      occasion: 'none',
      recipientName: '',
      contactId: '',
      location: '',
      description: '',
      notes: '',
    },
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts({ limit: 1000 }),
  });

  const contactsList = contactsData?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: giftsAPI.createGift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      queryClient.invalidateQueries({ queryKey: ['giftStats'] });
      Alert.alert('Success', 'Gift added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add gift');
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.title || !data.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const giftData = {
        title: data.title,
        giftType: data.giftType,
        category: data.category,
        amount: parseFloat(data.amount),
        currency: data.currency,
        quantity: parseInt(data.quantity) || 1,
        giftDate: data.giftDate.toISOString(),
        occasion: data.occasion,
        recipientName: data.recipientName || '',
        contactId: data.contactId || undefined,
        location: data.location || '',
        description: data.description || '',
        notes: data.notes || '',
      };

      createMutation.mutate(giftData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save gift');
    }
  };

  const giftTypes = ['given', 'received', 'charity', 'donation', 'reward', 'incentive'];
  const categories = ['money', 'item', 'service', 'food', 'clothing', 'electronics', 'other'];
  const occasions = ['birthday', 'wedding', 'graduation', 'holiday', 'anniversary', 'funeral', 'celebration', 'thank_you', 'other', 'none'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Gift</Text>

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
            name="giftType"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Gift Type *</Text>
                <View style={styles.categoryContainer}>
                  {giftTypes.map((type) => (
                    <Chip
                      key={type}
                      selected={value === type}
                      onPress={() => onChange(type)}
                      style={styles.categoryChip}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Category *</Text>
                <View style={styles.categoryContainer}>
                  {categories.map((cat) => (
                    <Chip
                      key={cat}
                      selected={value === cat}
                      onPress={() => onChange(cat)}
                      style={styles.categoryChip}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="amount"
            rules={{ required: 'Amount is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Amount *"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                error={!!errors.amount}
              />
            )}
          />
          {errors.amount && (
            <HelperText type="error">{errors.amount.message}</HelperText>
          )}

          <Controller
            control={control}
            name="giftDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Gift Date *</Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.dateButton}
                >
                  {value.toLocaleDateString()}
                </Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={value}
                    mode="date"
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
            name="occasion"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Occasion</Text>
                <View style={styles.categoryContainer}>
                  {occasions.map((occ) => (
                    <Chip
                      key={occ}
                      selected={value === occ}
                      onPress={() => onChange(occ)}
                      style={styles.categoryChip}
                    >
                      {occ.charAt(0).toUpperCase() + occ.slice(1).replace('_', ' ')}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="recipientName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Recipient Name"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Location"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="quantity"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Quantity"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Description"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                multiline
                numberOfLines={3}
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
            style={styles.submitButton}
            loading={createMutation.isPending}
            buttonColor="#ec4899"
          >
            Add Gift
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
  dateButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

