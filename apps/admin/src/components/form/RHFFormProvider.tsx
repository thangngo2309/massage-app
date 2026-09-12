"use client";

import { FormProvider, FieldValues, UseFormReturn } from "react-hook-form";

interface RHFFormProviderProps<TFieldValues extends FieldValues> {
  methods: UseFormReturn<TFieldValues>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
}

export function RHFFormProvider<TFieldValues extends FieldValues>({
  methods,
  onSubmit,
  children,
}: RHFFormProviderProps<TFieldValues>) {
  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={onSubmit}>
        {children}
      </form>
    </FormProvider>
  );
}
