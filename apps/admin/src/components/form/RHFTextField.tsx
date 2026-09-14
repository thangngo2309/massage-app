"use client";

import { TextField, type TextFieldProps } from "@mui/material";

import {
  Controller,
  type FieldValues,
  type Path,
  type RegisterOptions,
  useFormContext,
} from "react-hook-form";

export interface RHFTextFieldProps<TFieldValues extends FieldValues>
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
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ""}
          error={!!error}
          helperText={error?.message ?? helperText}
        />
      )}
    />
  );
}
