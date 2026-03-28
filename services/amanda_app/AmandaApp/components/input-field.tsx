// Reusable styled text input with focus state and icon.
// Used across login, signup, and any other form screens.

import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { theme } from '../constants/theme';
import { styles } from '../styles/login.styles';

interface InputFieldProps {
  icon: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput>;
}

export default function InputField({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
}: InputFieldProps) {
  // Tracks whether this input is focused to apply highlight styling
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}