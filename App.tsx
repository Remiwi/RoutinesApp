import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, StatusBar, Dimensions, Text } from 'react-native';
import { useFonts } from 'expo-font';
import { DatabaseProvider } from './database';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from './variables';

import Navbar, { NavbarButtonImageFactory } from './components/Navbar/Navbar';
import Routines from './screens/Routines/Routines';
import Tasks from './screens/Tasks/Tasks';
import Dummy from './screens/Dummy/Dummy';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MyDarkTheme = {
  dark: true,
  colors: {
    primary: 'rgb(10, 132, 255)',
    background: colors.background_grey,
    card: 'rgb(18, 18, 18)',
    text: 'rgb(229, 229, 231)',
    border: 'rgb(39, 39, 41)',
    notification: 'rgb(255, 69, 58)',
  },
};

export default function App() {
  // Load fonts
  // Sometimes when loading the fonts, they never load, leaving the app as a blank screen. Clearing the cache seems to fix this.
  // TODO: Figure out why this happens, whether or not it can happen in production, and how to fix it.
  const [fontsLoaded, error] = useFonts({
    'notoSansRegular': require('./assets/fonts/NotoSans-Regular.ttf'),
  });

  if (!fontsLoaded)
    return null
  
  return (
    <View style={{flex: 1, backgroundColor: colors.background_grey}}>
      <DatabaseProvider>
        <StatusBar barStyle='light-content' backgroundColor={colors.background_grey}/>      
        <View style={{height: Dimensions.get('window').height, width: '100%'}}>
          <NavigationContainer theme={MyDarkTheme}>
            <TabNavigator/>
          </NavigationContainer>
        </View>
      </DatabaseProvider>
    </View>

  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName='Routines'
      screenOptions={{
        headerShown: false,
      }}
      tabBar={props => <Navbar {...props}/>}
    >
      <Tab.Screen
        name="RoutinesTab"
        component={RoutinesNavigator}
        options={{
          tabBarIcon: NavbarButtonImageFactory(require('./assets/icons/sunrise.png')),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={Dummy}
        options={{
          tabBarIcon: NavbarButtonImageFactory(require('./assets/icons/bar_chart.png')),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={Dummy}
        options={{
          tabBarIcon: NavbarButtonImageFactory(require('./assets/icons/settings.png')),
        }}
      />
    </Tab.Navigator>
  )
}

function RoutinesNavigator() {
  return (
    <Stack.Navigator
      initialRouteName='Routines'
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="Routines"
        component={Routines}
      />
      <Stack.Screen
        name="Tasks"
        component={Tasks}
      />
    </Stack.Navigator>
  )
}