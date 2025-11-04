import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import LoansScreen from '../screens/main/LoansScreen';
import ContactsScreen from '../screens/main/ContactsScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import SavingsScreen from '../screens/main/SavingsScreen';
import ExpensesScreen from '../screens/main/ExpensesScreen';

// Detail Screens
import LoanDetailScreen from '../screens/details/LoanDetailScreen';
import ContactDetailScreen from '../screens/details/ContactDetailScreen';

// Form Screens
import AddLoanScreen from '../screens/forms/AddLoanScreen';
import AddContactScreen from '../screens/forms/AddContactScreen';
import AddTransactionScreen from '../screens/forms/AddTransactionScreen';
import AddExpenseScreen from '../screens/forms/AddExpenseScreen';
import AddSavingsScreen from '../screens/forms/AddSavingsScreen';
import AddPaymentScreen from '../screens/forms/AddPaymentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'cash' : 'cash-multiple';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'contacts' : 'contacts-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-bold';
          } else if (route.name === 'Savings') {
            iconName = focused ? 'piggy-bank' : 'piggy-bank-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'cash-minus' : 'cash-minus';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Loans" component={LoansScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="Savings" component={SavingsScreen} />
      <Tab.Screen name="Expenses" component={ExpensesScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="LoanDetail" 
            component={LoanDetailScreen}
            options={{ headerShown: true, title: 'Loan Details' }}
          />
          <Stack.Screen 
            name="ContactDetail" 
            component={ContactDetailScreen}
            options={{ headerShown: true, title: 'Contact Details' }}
          />
          <Stack.Screen 
            name="AddLoan" 
            component={AddLoanScreen}
            options={{ headerShown: true, title: 'Add Loan' }}
          />
          <Stack.Screen 
            name="EditLoan" 
            component={AddLoanScreen}
            options={{ headerShown: true, title: 'Edit Loan' }}
          />
          <Stack.Screen 
            name="AddContact" 
            component={AddContactScreen}
            options={{ headerShown: true, title: 'Add Contact' }}
          />
          <Stack.Screen 
            name="EditContact" 
            component={AddContactScreen}
            options={{ headerShown: true, title: 'Edit Contact' }}
          />
          <Stack.Screen 
            name="AddTransaction" 
            component={AddTransactionScreen}
            options={{ headerShown: true, title: 'Add Transaction' }}
          />
          <Stack.Screen 
            name="EditTransaction" 
            component={AddTransactionScreen}
            options={{ headerShown: true, title: 'Edit Transaction' }}
          />
          <Stack.Screen 
            name="AddExpense" 
            component={AddExpenseScreen}
            options={{ headerShown: true, title: 'Add Expense' }}
          />
          <Stack.Screen 
            name="AddSavings" 
            component={AddSavingsScreen}
            options={{ headerShown: true, title: 'Add Savings' }}
          />
          <Stack.Screen 
            name="EditSavings" 
            component={AddSavingsScreen}
            options={{ headerShown: true, title: 'Edit Savings' }}
          />
          <Stack.Screen 
            name="AddPayment" 
            component={AddPaymentScreen}
            options={{ headerShown: true, title: 'Add Payment' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

