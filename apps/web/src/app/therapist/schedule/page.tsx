"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { WorkingHoursEditor } from "@/components/therapist-self/WorkingHoursEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";

import { ApiError, getApiErrorMessage } from "@/lib/http";
import {
  createTherapistScheduleException,
  deleteTherapistScheduleException,
  getTherapistScheduleExceptions,
  getTherapistWorkingHours,
  replaceTherapistWorkingHours,
} from "@/lib/therapist-self";

import type { TherapistWorkingHour } from "@/types/therapist-self";

export default function TherapistSchedulePage() {
  const { t } = useTranslation("therapistSchedule");

  const queryClient = useQueryClient();

  const [workingHours, setWorkingHours] = useState<TherapistWorkingHour[]>([]);

  const [exceptionDate, setExceptionDate] = useState("");

  const [exceptionNote, setExceptionNote] = useState("");

  /**
   * =========================================
   * API ERROR -> I18N
   * =========================================
   *
   * Backend schedule APIs chỉ trả machine key.
   * Frontend translate bằng namespace therapistSchedule.
   */
  const getScheduleErrorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      return t(`errors.${error.message}`, {
        defaultValue: error.message,
      });
    }

    return getApiErrorMessage(error);
  };

  /**
   * =========================================
   * QUERIES
   * =========================================
   */

  const workingQuery = useQuery({
    queryKey: ["therapist-working-hours"],

    queryFn: getTherapistWorkingHours,
  });

  const exceptionQuery = useQuery({
    queryKey: ["therapist-schedule-exceptions"],

    queryFn: getTherapistScheduleExceptions,
  });

  useEffect(() => {
    if (workingQuery.data) {
      setWorkingHours(workingQuery.data);
    }
  }, [workingQuery.data]);

  /**
   * =========================================
   * SAVE WORKING HOURS
   * =========================================
   */

  const saveMutation = useMutation({
    mutationFn: () =>
      replaceTherapistWorkingHours({
        items: workingHours.map((item) => ({
          dayOfWeek: item.dayOfWeek,

          startTime: item.startTime,

          endTime: item.endTime,

          isActive: item.isActive,
        })),
      }),

    onSuccess: () => {
      toast.success(t("workingHours.updateSuccess"));

      void queryClient.invalidateQueries({
        queryKey: ["therapist-working-hours"],
      });
    },

    onError: (error) => {
      toast.error(getScheduleErrorMessage(error));
    },
  });

  /**
   * =========================================
   * CREATE EXCEPTION
   * =========================================
   */

  const createExceptionMutation = useMutation({
    mutationFn: () =>
      createTherapistScheduleException({
        date: exceptionDate,

        isDayOff: true,

        note: exceptionNote.trim() || undefined,
      }),

    onSuccess: () => {
      toast.success(t("exceptions.addSuccess"));

      setExceptionDate("");

      setExceptionNote("");

      void queryClient.invalidateQueries({
        queryKey: ["therapist-schedule-exceptions"],
      });
    },

    onError: (error) => {
      toast.error(getScheduleErrorMessage(error));
    },
  });

  /**
   * =========================================
   * DELETE EXCEPTION
   * =========================================
   */

  const deleteExceptionMutation = useMutation({
    mutationFn: deleteTherapistScheduleException,

    onSuccess: () => {
      toast.success(t("exceptions.deleteSuccess"));

      void queryClient.invalidateQueries({
        queryKey: ["therapist-schedule-exceptions"],
      });
    },

    onError: (error) => {
      toast.error(getScheduleErrorMessage(error));
    },
  });

  return (
    <PageContainer className="py-5 sm:py-6 lg:py-8">
      {/*
       * =====================================
       * HEADER
       * =====================================
       */}

      <div>
        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
          {t("page.title")}
        </h1>

        <p className="mt-2 text-sm text-slate-500">{t("page.description")}</p>
      </div>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/*
         * =====================================
         * WORKING HOURS
         * =====================================
         */}

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {t("workingHours.title")}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {t("workingHours.description")}
              </p>
            </div>

            <Button
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Save className="size-4" />

              {t("workingHours.save")}
            </Button>
          </div>

          <div className="mt-6">
            {workingQuery.isLoading ? (
              <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
            ) : (
              <WorkingHoursEditor
                value={workingHours}
                onChange={setWorkingHours}
              />
            )}
          </div>
        </Card>

        {/*
         * =====================================
         * EXCEPTIONS
         * =====================================
         */}

        <aside>
          <div className="space-y-5 xl:sticky xl:top-24">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-5 text-emerald-700" />

                <h2 className="font-bold text-slate-950">
                  {t("exceptions.dayOffTitle")}
                </h2>
              </div>

              <div className="mt-5 space-y-4">
                <input
                  type="date"
                  value={exceptionDate}
                  onChange={(event) => setExceptionDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
                />

                <textarea
                  rows={3}
                  value={exceptionNote}
                  onChange={(event) => setExceptionNote(event.target.value)}
                  placeholder={t("exceptions.notePlaceholder")}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />

                <Button
                  className="w-full"
                  disabled={!exceptionDate}
                  loading={createExceptionMutation.isPending}
                  onClick={() => createExceptionMutation.mutate()}
                >
                  <Plus className="size-4" />

                  {t("exceptions.add")}
                </Button>
              </div>
            </Card>

            {/*
             * =====================================
             * CREATED EXCEPTIONS
             * =====================================
             */}

            <Card className="p-5">
              <h2 className="font-bold text-slate-950">
                {t("exceptions.listTitle")}
              </h2>

              <div className="mt-4 space-y-3">
                {!exceptionQuery.data?.length && (
                  <div className="text-sm text-slate-400">
                    {t("exceptions.empty")}
                  </div>
                )}

                {exceptionQuery.data?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.date}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {item.note || t("exceptions.defaultDayOff")}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteExceptionMutation.mutate(item.id)}
                      className="flex size-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
