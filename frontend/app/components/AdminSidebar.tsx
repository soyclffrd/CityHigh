import { MaterialIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface AdminSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const AdminSidebar = ({ isCollapsed, toggleSidebar }: AdminSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;

  const navigateTo = (route: string) => {
    router.push(route as any);
    if (!isCollapsed) toggleSidebar();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout();
              router.replace('/login');
              if (!isCollapsed) toggleSidebar();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={[
      styles.sidebar,
      isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
      isMobile && styles.sidebarMobile
    ]}>
      <TouchableOpacity onPress={toggleSidebar} style={styles.toggleButton}>
        <MaterialIcons 
          name={isCollapsed ? 'menu' : 'close'} 
          size={24} 
          color="#666" 
        />
      </TouchableOpacity>

      {!isCollapsed && (
        <View style={styles.sidebarContent}>
          <View style={styles.schoolInfo}>
            <Image
              source={require('../../assets/images/logosacityhigh.png')}
              style={styles.schoolLogo}
            />
            <Text style={styles.schoolName}>Surigao City NHS</Text>
          </View>

          <View style={styles.menu}>
            {[
              { icon: '🏠', text: 'Dashboard', route: '/admin/dashboardoverview' },
              { icon: '👨‍🏫', text: 'Teachers', route: '/admin/teachers' },
              { icon: '🎓', text: 'Students', route: '/admin/students' },
              { icon: '📚', text: 'Subjects', route: '/admin/subjects' },
              { icon: '📊', text: 'Strands', route: '/admin/strands' },
              { icon: '📈', text: 'Grades Level', route: '/admin/gradelevels' },
              { icon: '🗂️', text: 'Section', route: '/admin/section' },
              { icon: '👤', text: 'Users', route: '/admin/users' },
              { icon: '⚙️', text: 'Settings', route: '/admin/settings' },
            ].map(({ icon, text, route }) => (
              <TouchableOpacity 
                key={text} 
                style={[
                  styles.menuItem,
                  pathname === route && styles.activeMenuItem
                ]} 
                onPress={() => navigateTo(route)}
              >
                <Text style={styles.menuIcon}>{icon}</Text>
                <Text style={[
                  styles.menuText,
                  pathname === route && styles.activeMenuText
                ]}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {isCollapsed && (
        <View style={styles.collapsedMenu}>
          {[
            '🏠', '👨‍🏫', '🎓', '📚', '📊', '📈', '🗂️', '👤', '⚙️',
          ].map((icon, index) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.collapsedMenuItem,
                pathname === [
                  '/admin/dashboardoverview',
                  '/admin/teachers',
                  '/admin/students',
                  '/admin/subjects',
                  '/admin/strands',
                  '/admin/gradelevels',
                  '/admin/section',
                  '/admin/users',
                  '/admin/settings',
                ][index] && styles.activeCollapsedMenuItem
              ]}
              onPress={() => navigateTo([
                '/admin/dashboardoverview',
                '/admin/teachers',
                '/admin/students',
                '/admin/subjects',
                '/admin/strands',
                '/admin/gradelevels',
                '/admin/section',
                '/admin/users',
                '/admin/settings',
              ][index])}
            >
              <Text style={styles.menuIcon}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.logoutButton,
          isCollapsed ? styles.collapsedLogoutButton : null,
          isLoggingOut && styles.logoutButtonDisabled
        ]}
        onPress={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? (
          <ActivityIndicator color="#FF3B30" />
        ) : (
          <View style={styles.logoutContent}>
            <MaterialIcons name="logout" size={24} color="#FF3B30" />
            {!isCollapsed && <Text style={styles.logoutText}>Logout</Text>}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#fff',
    height: '100%',
    borderRightWidth: 1,
    borderColor: '#e0e0e0',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '2px 0 5px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
      },
    }),
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
  },
  sidebarExpanded: {
    width: 220,
  },
  sidebarCollapsed: {
    width: 60,
    alignItems: 'center',
  },
  toggleButton: {
    position: 'absolute',
    top: 24,
    right: 12,
    padding: 8,
    zIndex: 1,
  },
  sidebarContent: {
    paddingHorizontal: 14,
    paddingTop: 72,
    paddingBottom: 80,
    width: '100%',
  },
  schoolInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    width: '100%',
  },
  schoolLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  menu: {
    marginTop: 12,
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 3,
    borderRadius: 8,
    width: '100%',
  },
  activeMenuItem: {
    backgroundColor: '#f0f7ff',
  },
  menuIcon: {
    fontSize: 22,
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  activeMenuText: {
    color: '#1a73e8',
    fontWeight: '500',
  },
  collapsedMenu: {
    marginTop: 72,
    alignItems: 'center',
    paddingBottom: 80,
    width: '100%',
  },
  collapsedMenuItem: {
    paddingVertical: 11,
    marginBottom: 3,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  activeCollapsedMenuItem: {
    backgroundColor: '#f0f7ff',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  collapsedLogoutButton: {
    left: 0,
    right: 0,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  logoutButtonDisabled: {
    opacity: 0.7,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default AdminSidebar;
