import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, Chip, SegmentedButtons } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { giftsAPI, savingsAPI, pettyCashAPI, businessesAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ContactPicker from '../../components/ContactPicker';
import { handleApiError } from '../../utils/errorHandler';

export default function AddGiftScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
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
      resourceType: '',
      resourceId: '',
    },
  });

  const giftType = watch('giftType');
  const category = watch('category');

  // Clear resource selection when giftType or category changes
  useEffect(() => {
    if (giftType !== 'given' || category !== 'money') {
      setSelectedResourceType('');
      setSelectedResource(null);
      setValue('resourceType', '');
      setValue('resourceId', '');
    }
  }, [giftType, category, setValue]);

  // Fetch resources for source selection (only for "given" gifts with money category)
  const { data: savingsData, isLoading: loadingSavings, error: savingsError } = useQuery({
    queryKey: ['savings'],
    queryFn: () => savingsAPI.getSavings({ limit: 100 }),
    enabled: giftType === 'given' && category === 'money',
    retry: 1,
  });

  const { data: pettyCashData, isLoading: loadingPettyCash, error: pettyCashError } = useQuery({
    queryKey: ['pettyCash'],
    queryFn: () => pettyCashAPI.getPettyCash(),
    enabled: giftType === 'given' && category === 'money',
    retry: 1,
  });

  const { data: businessesData, isLoading: loadingBusinesses, error: businessesError } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => businessesAPI.getBusinesses({ limit: 100 }),
    enabled: giftType === 'given' && category === 'money',
    retry: 1,
  });

  const savingsList = savingsData?.data?.data || savingsData?.data || [];
  const pettyCash = pettyCashData?.data?.data || pettyCashData?.data || null;
  const pettyCashList = pettyCash ? [pettyCash] : [];
  const businessesList = businessesData?.data?.data || businessesData?.data || [];

  const resourceList = useMemo(() => {
    if (!selectedResourceType) return [];
    
    switch (selectedResourceType) {
      case 'savings':
        return savingsList.map(s => ({ 
          id: s._id, 
          name: s.name || 'Savings Account', 
          balance: s.amount || s.currentBalance || 0, 
          currency: s.currency || 'FRW' 
        }));
      case 'petty_cash':
        return pettyCashList.map(pc => ({ 
          id: pc._id || 'petty-cash-default', 
          name: pc.name || 'Petty Cash', 
          balance: pc.currentBalance || pc.balance || 0, 
          currency: pc.currency || 'FRW' 
        }));
      case 'business':
        return businessesList.map(b => ({ 
          id: b._id, 
          name: b.name || 'Business', 
          balance: b.totalRevenue || b.currentBalance || 0, 
          currency: b.currency || 'FRW' 
        }));
      default:
        return [];
    }
  }, [selectedResourceType, savingsList, pettyCashList, businessesList]);

  const createMutation = useMutation({
    mutationFn: giftsAPI.createGift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] });
      queryClient.invalidateQueries({ queryKey: ['giftStats'] });
      Alert.alert('Success', 'Gift added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      if (error.isOffline || error.name === 'OfflineError') {
        Alert.alert(
          'Offline Mode',
          'Gift saved locally and will sync when online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        handleApiError(error, 'Failed to add gift. Please try again.');
      }
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.title || !data.amount) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // For "given" gifts, validate resource selection
      if (data.giftType === 'given' && data.category === 'money') {
        if (!selectedResourceType) {
          Alert.alert('Error', 'Please select a resource type');
          return;
        }
        if (!selectedResource && selectedResourceType !== 'cash' && selectedResourceType !== 'income') {
          Alert.alert('Error', 'Please select a resource');
          return;
        }
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

      // Add resource information for "given" gifts
      if (data.giftType === 'given' && data.category === 'money' && selectedResourceType) {
        giftData.resource = {
          type: selectedResourceType,
          resourceId: selectedResource?.id || null,
          resourceName: selectedResource?.name || `${selectedResourceType.charAt(0).toUpperCase() + selectedResourceType.slice(1)} - General`,
          amount: parseFloat(data.amount),
          currency: data.currency,
        };
      }

      createMutation.mutate(giftData);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to save gift');
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

          <ContactPicker
            control={control}
            name="contactId"
            label="Contact (Optional)"
            required={false}
            errors={errors}
            setValue={setValue}
          />

          {/* Resource Selection - Only show for "given" gifts with money category */}
          {giftType === 'given' && category === 'money' && (
            <>
              <Text variant="bodyMedium" style={styles.label}>Resource Type *</Text>
              <SegmentedButtons
                value={selectedResourceType}
                onValueChange={(value) => {
                  setSelectedResourceType(value);
                  setSelectedResource(null);
                  setValue('resourceType', value);
                  setValue('resourceId', '');
                }}
                buttons={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'petty_cash', label: 'Petty Cash' },
                  { value: 'savings', label: 'Savings' },
                  { value: 'business', label: 'Business' },
                ]}
                style={styles.segmentedButtons}
              />

              {selectedResourceType && resourceList.length > 0 && (
                <View>
                  <Text variant="bodyMedium" style={styles.label}>Resource *</Text>
                  {resourceList.map((resource) => (
                    <Button
                      key={resource.id}
                      mode={selectedResource?.id === resource.id ? 'contained' : 'outlined'}
                      onPress={() => {
                        setSelectedResource(resource);
                        setValue('resourceId', resource.id);
                      }}
                      style={styles.resourceButton}
                    >
                      {resource.name} - {resource.balance?.toLocaleString()} {resource.currency}
                    </Button>
                  ))}
                </View>
              )}

              {selectedResourceType && selectedResourceType !== 'cash' && resourceList.length === 0 && (
                <View style={styles.infoContainer}>
                  <Text variant="bodySmall" style={styles.infoText}>
                    {(loadingSavings || loadingPettyCash || loadingBusinesses) 
                      ? 'Loading resources...' 
                      : (selectedResourceType === 'savings' && savingsError) 
                        ? 'Error loading savings accounts'
                        : (selectedResourceType === 'petty_cash' && pettyCashError)
                          ? 'No petty cash account found. Please create one first.'
                          : (selectedResourceType === 'business' && businessesError)
                            ? 'Error loading businesses'
                            : 'No resources available. Please create savings, petty cash, or business accounts first.'}
                  </Text>
                </View>
              )}

              {selectedResourceType === 'cash' && (
                <View style={styles.infoContainer}>
                  <Text variant="bodySmall" style={styles.infoText}>
                    Using cash for this gift
                  </Text>
                </View>
              )}
            </>
          )}

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
  segmentedButtons: {
    marginBottom: 16,
  },
  resourceButton: {
    marginBottom: 8,
  },
  infoContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  infoText: {
    color: '#0369a1',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

