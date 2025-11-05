import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Text, HelperText, SegmentedButtons, Chip, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesAPI, savingsAPI, pettyCashAPI } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ContactPicker from '../../components/ContactPicker';
import { handleApiError } from '../../utils/errorHandler';

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      category: 'food',
      title: '',
      description: '',
      amount: '',
      currency: 'FRW',
      expenseDate: new Date(),
      paymentMethod: 'cash',
      sourceType: 'cash', // cash, savings, petty_cash
      sourceId: '',
      contactId: '', // Add contact field
      location: '',
      vendor: '',
      notes: '',
    },
  });

  const sourceType = watch('sourceType');

  // Fetch savings and petty cash for source selection - always fetch petty cash if needed
  const { data: savingsData } = useQuery({
    queryKey: ['savings'],
    queryFn: () => savingsAPI.getSavings({ limit: 100 }),
    enabled: sourceType === 'savings',
  });

  const { data: pettyCashData, isLoading: loadingPettyCash, error: pettyCashError } = useQuery({
    queryKey: ['pettyCash'],
    queryFn: () => pettyCashAPI.getPettyCash(),
    enabled: sourceType === 'petty_cash',
    retry: 1,
  });

  const savingsList = savingsData?.data?.data || [];
  // Petty cash is a single object, not an array
  const pettyCash = pettyCashData?.data?.data || pettyCashData?.data || null;
  const pettyCashList = pettyCash ? [pettyCash] : [];

  // Debug logging
  useEffect(() => {
    if (sourceType === 'petty_cash') {
      console.log('Petty Cash Data:', pettyCashData);
      console.log('Petty Cash Object:', pettyCash);
      console.log('Petty Cash List:', pettyCashList);
      console.log('Loading:', loadingPettyCash);
      console.log('Error:', pettyCashError);
    }
  }, [sourceType, pettyCashData, pettyCash, pettyCashList, loadingPettyCash, pettyCashError]);

  const createMutation = useMutation({
    mutationFn: expensesAPI.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenseStats'] });
      queryClient.invalidateQueries({ queryKey: ['savings'] }); // Invalidate savings if source was savings
      queryClient.invalidateQueries({ queryKey: ['pettyCash'] }); // Invalidate petty cash if source was petty cash
      queryClient.invalidateQueries({ queryKey: ['pettyCashStats'] }); // Invalidate stats
      Alert.alert('Success', 'Expense added successfully');
      navigation.goBack();
    },
    onError: (error) => {
      if (error.isOffline || error.name === 'OfflineError') {
        Alert.alert(
          'Offline Mode',
          'Expense saved locally and will sync when online.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        handleApiError(error, 'Failed to add expense. Please try again.');
      }
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.amount || parseFloat(data.amount) <= 0) {
        Alert.alert('Error', 'Please enter a valid amount');
        return;
      }

      // Source selection is REQUIRED - expense must be deducted from somewhere
      if (!data.sourceType) {
        Alert.alert('Error', 'Please select where the amount is reduced from');
        return;
      }

      // Validate source selection for savings and petty cash
      if (data.sourceType === 'savings' && !data.sourceId) {
        Alert.alert('Error', 'Please select a savings account');
        return;
      }

      if (data.sourceType === 'petty_cash' && !data.sourceId) {
        Alert.alert('Error', 'Please select a petty cash account');
        return;
      }

      const expenseData = {
        ...data,
        amount: parseFloat(data.amount),
        date: data.expenseDate.toISOString(),
        expenseDate: data.expenseDate.toISOString(),
        contactId: data.contactId || undefined,
        source: {
          type: data.sourceType,
          sourceId: data.sourceType === 'cash' ? null : (data.sourceId || null),
        },
      };
      createMutation.mutate(expenseData);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to save expense');
    }
  };

  const categories = [
    'food', 'transport', 'housing', 'utilities', 'healthcare', 
    'education', 'entertainment', 'clothing', 'business', 'other'
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text variant="headlineSmall" style={styles.title}>Add Expense</Text>

          <ContactPicker
            control={control}
            name="contactId"
            label="Contact (Optional)"
            required={false}
            errors={errors}
            setValue={setValue}
          />

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
            name="category"
            rules={{ required: 'Category is required' }}
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
            name="expenseDate"
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Date *</Text>
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
            name="paymentMethod"
            render={({ field: { onChange, value } }) => (
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
                buttons={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'card', label: 'Card' },
                  { value: 'mobile', label: 'Mobile' },
                ]}
                style={styles.segmentedButtons}
              />
            )}
          />

          <Controller
            control={control}
            name="sourceType"
            rules={{ required: 'Please select where the amount is reduced from' }}
            render={({ field: { onChange, value } }) => (
              <View>
                <Text variant="bodyMedium" style={styles.label}>Amount Reduced From *</Text>
                <SegmentedButtons
                  value={value || ''}
                  onValueChange={(newValue) => {
                    onChange(newValue);
                    // Clear sourceId when changing source type
                    setValue('sourceId', '');
                  }}
                  buttons={[
                    { value: 'cash', label: 'Cash' },
                    { value: 'savings', label: 'Savings' },
                    { value: 'petty_cash', label: 'Petty Cash' },
                  ]}
                  style={styles.segmentedButtons}
                />
                {errors.sourceType && (
                  <HelperText type="error">{errors.sourceType.message}</HelperText>
                )}
              </View>
            )}
          />

          {sourceType === 'savings' && (
            <Controller
              control={control}
              name="sourceId"
              rules={{ required: sourceType === 'savings' ? 'Please select a savings account' : false }}
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text variant="bodyMedium" style={styles.label}>Select Savings Account *</Text>
                  <View style={styles.sourceContainer}>
                    {savingsList.map((saving) => (
                      <Chip
                        key={saving._id}
                        selected={value === saving._id}
                        onPress={() => onChange(saving._id)}
                        style={styles.sourceChip}
                      >
                        {saving.name} ({saving.amount || 0} {saving.currency || 'FRW'})
                      </Chip>
                    ))}
                  </View>
                  {errors.sourceId && (
                    <HelperText type="error">{errors.sourceId.message}</HelperText>
                  )}
                </View>
              )}
            />
          )}

          {sourceType === 'petty_cash' && (
            <Controller
              control={control}
              name="sourceId"
              rules={{ required: sourceType === 'petty_cash' ? 'Please select a petty cash account' : false }}
              render={({ field: { onChange, value } }) => (
                <View>
                  <Text variant="bodyMedium" style={styles.label}>Select Petty Cash Account *</Text>
                  {loadingPettyCash ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" />
                      <Text variant="bodySmall" style={styles.loadingText}>Loading petty cash...</Text>
                    </View>
                  ) : pettyCashList.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text variant="bodySmall" style={styles.errorText}>
                        No petty cash account found. Please create one first.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.sourceContainer}>
                      {pettyCashList.map((pc) => (
                        <Chip
                          key={pc._id || 'petty-cash-default'}
                          selected={value === (pc._id || 'petty-cash-default')}
                          onPress={() => onChange(pc._id || 'petty-cash-default')}
                          style={styles.sourceChip}
                        >
                          {pc.name || 'Petty Cash'} ({pc.currentBalance || pc.balance || 0} {pc.currency || 'FRW'})
                        </Chip>
                      ))}
                    </View>
                  )}
                  {errors.sourceId && (
                    <HelperText type="error">{errors.sourceId.message}</HelperText>
                  )}
                </View>
              )}
            />
          )}

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
            name="vendor"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Vendor"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.submitButton}
            loading={createMutation.isPending}
          >
            Add Expense
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
  sourceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sourceChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748b',
  },
  emptyContainer: {
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
  // Contact selection styles
  contactSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  contactButton: {
    marginBottom: 8,
  },
  selectedContactCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#25D366',
    marginBottom: 8,
  },
  selectedContactContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedContactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedContactAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectedContactInfo: {
    flex: 1,
  },
  selectedContactName: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 15,
  },
  selectedContactPhone: {
    color: '#64748b',
    fontSize: 13,
  },
  editIconContainer: {
    padding: 8,
  },
  editIcon: {
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 20,
    color: '#1a202c',
  },
  modalContactList: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    padding: 12,
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  searchInput: {
    backgroundColor: '#f7fafc',
  },
  searchLoader: {
    position: 'absolute',
    right: 24,
    top: 24,
  },
  contactListContent: {
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactItemPressed: {
    backgroundColor: '#f5f5f5',
  },
  selectedContactItem: {
    backgroundColor: '#e8f5e9',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarContainerSelected: {
    backgroundColor: '#25D366',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactItemInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '500',
    marginBottom: 2,
    color: '#212121',
    fontSize: 15,
  },
  contactPhone: {
    color: '#757575',
    fontSize: 13,
    marginBottom: 2,
  },
  phoneNumbersContainer: {
    marginTop: 2,
  },
  multiplePhonesIndicator: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
  },
  multiplePhonesHint: {
    color: '#8b5cf6',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  deviceLabel: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
  },
  phonePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  phonePickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  phonePickerHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    position: 'relative',
  },
  phonePickerCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  phonePickerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  phonePickerAvatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#ffffff',
  },
  phonePickerName: {
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  phonePickerSubtitle: {
    color: '#64748b',
    fontSize: 14,
  },
  phonePickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  phonePickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phonePickerIcon: {
    marginRight: 16,
  },
  phonePickerItemInfo: {
    flex: 1,
  },
  phonePickerNumber: {
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  phonePickerPrimary: {
    color: '#64748b',
    fontSize: 12,
  },
  phonePickerCancel: {
    marginTop: 16,
    marginHorizontal: 16,
  },
});

