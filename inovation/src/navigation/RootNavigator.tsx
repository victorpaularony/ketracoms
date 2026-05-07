import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ReportMessageScreen from '../screens/ReportMessageScreen';
import PhotoScreen from '../screens/PhotoScreen';
import FormScreen from '../screens/FormScreen';

export type RootStackParamList = {
    Home: undefined;
    ReportMessage: undefined;
    Photo: { reportMessage: string };
    Feedback: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="ReportMessage" component={ReportMessageScreen} />
            <Stack.Screen name="Photo" component={PhotoScreen} />
            <Stack.Screen name="Feedback" component={FormScreen} />
        </Stack.Navigator>
    );
}
