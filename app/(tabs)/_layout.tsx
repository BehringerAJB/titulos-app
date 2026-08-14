/**
 * Layout de tabs — navegación principal de la app
 *
 * La barra de pestañas respeta el "safe area" inferior del dispositivo
 * (barra de navegación/gestos de Android, home indicator de iOS) para
 * que los botones de la app no se superpongan con los del sistema.
 */

import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Espacio inferior real del dispositivo (nunca menor al padding original)
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 28 : 10);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          backgroundColor: Colors.primary,
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
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
