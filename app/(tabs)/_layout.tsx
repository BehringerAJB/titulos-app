/**
 * Layout de tabs — navegación principal de la app
 */

import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  // En Android, la barra de navegación del sistema (los 3 botones o la
  // barra de gestos) puede ocupar el mismo espacio que la tab bar de la
  // app. Usamos el inset inferior real del dispositivo para que la tab bar
  // suba lo necesario y no se superponga ni quede tapada.
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'android' ? insets.bottom : 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: (Platform.OS === 'ios' ? 88 : 64) + bottomInset,
          paddingBottom: (Platform.OS === 'ios' ? 28 : 10) + bottomInset,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.textLight,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🏠" color={color} />
          ),
          headerTitle: 'Gestión de Títulos',
        }}
      />
      <Tabs.Screen
        name="nuevo"
        options={{
          title: 'Nuevo Título',
          tabBarIcon: ({ color }) => <TabIcon emoji="📷" color={color} />,
          headerTitle: 'Alta de Título',
        }}
      />
      <Tabs.Screen
        name="buscar"
        options={{
          title: 'Buscar / Editar',
          tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} />,
          headerTitle: 'Buscar y Editar',
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: 22, opacity: color === Colors.accent ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}
