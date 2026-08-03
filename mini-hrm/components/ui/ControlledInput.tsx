import React from 'react';
import { Controller, Control, FieldValues, FieldPath } from 'react-hook-form';
import { LoginInputField, LoginInputFieldProps } from '@/components/ui/LoginInputField';

export interface ControlledInputProps<TFieldValues extends FieldValues>
  extends Omit<LoginInputFieldProps, 'name' | 'value' | 'onChangeText'> {
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  error?: string;
}

export function ControlledInput<TFieldValues extends FieldValues>({
  name,
  control,
  error: customError,
  ...inputProps
}: ControlledInputProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { onChange, onBlur, value },
        fieldState: { error },
      }) => {
        const errorMessage = error?.message || customError;
        return (
          <LoginInputField
            value={typeof value === 'string' ? value : String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errorMessage}
            {...inputProps}
          />
        );
      }}
    />
  );
}

export default ControlledInput;
