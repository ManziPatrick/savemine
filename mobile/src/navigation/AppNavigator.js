import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
import AssetsScreen from '../screens/main/AssetsScreen';
import InvestmentsScreen from '../screens/main/InvestmentsScreen';
import BusinessScreen from '../screens/main/BusinessScreen';
import GiftsScreen from '../screens/main/GiftsScreen';
import PettyCashScreen from '../screens/main/PettyCashScreen';
import RemindersScreen from '../screens/main/RemindersScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MoreMainScreen from '../screens/main/MoreMainScreen';

// Detail Screens
import LoanDetailScreen from '../screens/details/LoanDetailScreen';
import ContactDetailScreen from '../screens/details/ContactDetailScreen';
import AssetDetailScreen from '../screens/details/AssetDetailScreen';

// Form Screens
import AddLoanScreen from '../screens/forms/AddLoanScreen';
import AddContactScreen from '../screens/forms/AddContactScreen';
import AddTransactionScreen from '../screens/forms/AddTransactionScreen';
import AddExpenseScreen from '../screens/forms/AddExpenseScreen';
import AddSavingsScreen from '../screens/forms/AddSavingsScreen';
import AddPaymentScreen from '../screens/forms/AddPaymentScreen';
import AddDepositScreen from '../screens/forms/AddDepositScreen';
import AddWithdrawalScreen from '../screens/forms/AddWithdrawalScreen';
import AddAssetScreen from '../screens/forms/AddAssetScreen';
import AddInvestmentScreen from '../screens/forms/AddInvestmentScreen';
import AddBusinessScreen from '../screens/forms/AddBusinessScreen';
import AddGiftScreen from '../screens/forms/AddGiftScreen';
import AddReminderScreen from '../screens/forms/AddReminderScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MoreStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MoreMain" 
        component={MoreMainScreen}
        options={{ headerShown: true, title: 'More' }}
      />
      <Stack.Screen name="Assets" component={AssetsScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Investments" component={InvestmentsScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Business" component={BusinessScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Gifts" component={GiftsScreen} options={{ headerShown: true }} />
      <Stack.Screen name="PettyCash" component={PettyCashScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Reminders" component={RemindersScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
      <Stack.Screen 
        name="AddDeposit" 
        component={AddDepositScreen}
        options={{ headerShown: true, title: 'Add Deposit' }}
      />
      <Stack.Screen 
        name="AddWithdrawal" 
        component={AddWithdrawalScreen}
        options={{ headerShown: true, title: 'Record Withdrawal' }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          const iconSize = focused ? 32 : 26; // Bigger, more visible icons

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
          } else if (route.name === 'More') {
            iconName = focused ? 'view-grid' : 'view-grid-outline';
          }

          return <Icon name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 6,
          backgroundColor: '#ffffff',
          borderTopWidth: 2,
          borderTopColor: '#e5e7eb',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          display: 'none',
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          paddingVertical: 8,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarBadgeStyle: {
          backgroundColor: '#ef4444',
          fontSize: 10,
          minWidth: 18,
          height: 18,
        },
        headerShown: true,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Loans" 
        component={LoansScreen}
        options={{
          tabBarLabel: 'Loans',
        }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactsScreen}
        options={{
          tabBarLabel: 'Contacts',
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
        }}
      />
      <Tab.Screen 
        name="Savings" 
        component={SavingsScreen}
        options={{
          tabBarLabel: 'Savings',
        }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{
          tabBarLabel: 'Expenses',
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreStack}
        options={{ 
          headerShown: false,
          tabBarLabel: 'More',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated ? "MainTabs" : "Login"}
    >
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
            name="AssetDetail" 
            component={AssetDetailScreen}
            options={{ headerShown: true, title: 'Asset Details' }}
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
          <Stack.Screen 
            name="AddDeposit" 
            component={AddDepositScreen}
            options={{ headerShown: true, title: 'Add Deposit' }}
          />
          <Stack.Screen 
            name="AddWithdrawal" 
            component={AddWithdrawalScreen}
            options={{ headerShown: true, title: 'Record Withdrawal' }}
          />
          <Stack.Screen 
            name="AddAsset" 
            component={AddAssetScreen}
            options={{ headerShown: true, title: 'Add Asset' }}
          />
          <Stack.Screen 
            name="EditAsset" 
            component={AddAssetScreen}
            options={{ headerShown: true, title: 'Edit Asset' }}
          />
          <Stack.Screen 
            name="AddInvestment" 
            component={AddInvestmentScreen}
            options={{ headerShown: true, title: 'Add Investment' }}
          />
          <Stack.Screen 
            name="AddBusiness" 
            component={AddBusinessScreen}
            options={{ headerShown: true, title: 'Add Business' }}
          />
          <Stack.Screen 
            name="AddGift" 
            component={AddGiftScreen}
            options={{ headerShown: true, title: 'Add Gift' }}
          />
          <Stack.Screen 
            name="AddReminder" 
            component={AddReminderScreen}
            options={{ headerShown: true, title: 'Add Reminder' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
