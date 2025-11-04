import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddAssetScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      value: '',
      currency: 'FRW',
      category: 'Electronics',
      status: 'owned',
      location: '',
      serialNumber: '',
      purchaseDate: new Date(),
      depreciationRate: '0',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: assetsAPI.createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['assetStats'] });
      Alert.alert('Success', 'Asset added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add asset');
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.name || !data.value) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const assetData = {
        name: data.name,
        description: data.description || '',
        value: parseFloat(data.value),
        currency: data.currency,
        category: data.category,
        status: data.status,
        location: data.location || '',
        serialNumber: data.serialNumber || '',
        purchaseDate: data.purchaseDate.toISOString(),
        depreciationRate: parseFloat(data.depreciationRate) || 0,
        notes: data.notes || '',
      };

      createMutation.mutate(assetData);
    } catch (error) {
      Alert.alert('Error', 'Failed to save asset');
    }
  };

  const categories = ['Electronics', 'Vehicle', 'Property', 'Furniture', 'Equipment', 'Jewelry', 'Art', 'Books', 'Clothing', 'Other'];
  const statuses = ['owned', 'loaned', 'shared'];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Asset</Text>

          <Controller
            control={control}
            name="name"
            rules={{ required: 'Asset name is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Asset Name *"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
              />
            )}
          />
          {errors.name && (
            <HelperText type="error">{errors.name.message}</HelperText>
          )}

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
                      {cat}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="value"
            rules={{ required: 'Value is required' }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Value *"
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                error={!!errors.value}
              />
            )}
          />
          {errors.value && (
            <HelperText type="error">{errors.value.message}</HelperText>
          )}

          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Status</Text>
                <View style={styles.statusContainer}>
                  {statuses.map((status) => (
                    <Chip
                      key={status}
                      selected={value === status}
                      onPress={() => onChange(status)}
                      style={styles.statusChip}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          />

          <Controller
            control={control}
            name="purchaseDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Purchase Date</Text>
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
            name="serialNumber"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Serial Number"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Controller
            control={control}
            name="depreciationRate"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Depreciation Rate (%)"
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
            buttonColor="#2563eb"
          >
            Add Asset
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

