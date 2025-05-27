import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export const Input: React.FC<TextInputProps> = (props) => {
  return <TextInput style={styles.input} {...props} />;
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
}); 