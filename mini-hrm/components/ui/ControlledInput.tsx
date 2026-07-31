import React from 'react';
import { useController, Control, FieldValues, Path } from 'react-hook-form';
import { LoginInputField, LoginInputFieldProps } from '@/components/ui/LoginInputField';

export interface ControlledInputProps<T extends FieldValues>
  extends Omit<LoginInputFieldProps, 'value' | 'onChangeText'> {
  name: Path<T>;
  control: Control<T>;
}

export function ControlledInput<T extends FieldValues>({
  name,
  control,
  error: customError,
  ...inputProps
}: ControlledInputProps<T>) {
  const {
    field: { onChange, onBlur, value },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  return (
    <LoginInputField
      value={typeof value === 'string' ? value : String(value ?? '')}
      onChangeText={onChange}
      onBlur={onBlur}
      error={error?.message || customError}
      {...inputProps}
    />
  );
}

export default ControlledInput;
