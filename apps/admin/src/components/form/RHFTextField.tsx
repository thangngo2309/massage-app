"use client";

import { TextField, TextFieldProps } from "@mui/material";

import {
  Controller,
  FieldValues,
  Path,
  RegisterOptions,
  useFormContext,
} from "react-hook-form";

interface RHFTextFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextFieldProps, "name"> {
  name: Path<TFieldValues>;

  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
}

export function RHFTextField<TFieldValues extends FieldValues>({
  name,
  rules,
  helperText,
  ...props
}: RHFTextFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          error={!!fieldState.error}
          helperText={fieldState.error?.message || helperText}
        />
      )}
    />
  );
}
