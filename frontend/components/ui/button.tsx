import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ onPress, title, variant = 'default', size = 'md', className, type = 'button', disabled = false }) => {
  const buttonStyle = [
    styles.button,
    variant === 'outline' ? styles.outlineButton : styles.defaultButton,
    size === 'sm' ? styles.smallButton : size === 'lg' ? styles.largeButton : styles.mediumButton,
    disabled && styles.buttonDisabled
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'outline' ? { color: '#007AFF' } : { color: '#FFFFFF' },
    disabled && styles.buttonTextDisabled
  ];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={buttonStyle}
      disabled={disabled}
    >
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultButton: {
    backgroundColor: '#007AFF',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  smallButton: {
    padding: 5,
  },
  mediumButton: {
    padding: 10,
  },
  largeButton: {
    padding: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: '#999999',
  }
}); 