import React, { createContext, useContext, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
}

interface TabsContextProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextProps | undefined>(undefined);

export const Tabs: React.FC<TabsProps> = ({ children, defaultValue = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <View>{children}</View>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.tabsList}>{children}</View>
);

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');
  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;
  return (
    <TouchableOpacity
      style={[styles.tabTrigger, isActive && styles.tabTriggerActive]}
      onPress={() => setActiveTab(value)}
    >
      <Text style={isActive ? styles.tabTextActive : styles.tabText}>{children}</Text>
    </TouchableOpacity>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');
  const { activeTab } = context;
  if (activeTab !== value) return null;
  return <View style={styles.tabContent}>{children}</View>;
};

const styles = StyleSheet.create({
  tabsList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tabTrigger: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  tabTriggerActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#333',
    fontWeight: 'normal',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  tabContent: {
    paddingVertical: 8,
  },
}); 