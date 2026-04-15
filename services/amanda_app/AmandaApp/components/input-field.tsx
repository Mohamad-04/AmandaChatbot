// Reusable styled text input with focus state and icon.
// Used across login, signup, and any other form screens.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  const [focused,  setFocused]  = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isPassword = secureTextEntry;

  return (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        ref={inputRef}
        style={[styles.input, { backgroundColor: 'transparent', flex: 1 }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isPassword && !revealed}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        textContentType={textContentType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {isPassword && (
        <TouchableOpacity
          onPress={() => setRevealed(r => !r)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ paddingRight: 4 }}
        >
          <Feather
            name={revealed ? 'eye-off' : 'eye'}
            size={18}
            color={theme.colors.placeholder}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}