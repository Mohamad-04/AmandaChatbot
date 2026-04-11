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
  // Tells iOS what kind of content this field holds — prevents unwanted AutoFill yellow highlight.
  // Use "oneTimeCode" for tokens, "none" to fully disable AutoFill.
  textContentType?: 'none' | 'emailAddress' | 'password' | 'newPassword' | 'oneTimeCode' | 'username';
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
  textContentType = 'none',
}: InputFieldProps) {
  // Tracks whether this input is focused to apply highlight styling
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        ref={inputRef}
        style={[styles.input, { backgroundColor: 'transparent' }]}
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
        textContentType={textContentType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}