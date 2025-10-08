"use client";

import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Spinner } from "@heroui/react";
import TodayScheduleCard from "./TodayScheduleCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSchedule } from "@/pages/api/schedule";
import { useState } from "react";

interface ITodayTimelineProps {
  schedules: any[];
  isLoading: boolean;
  onTimeClick: (hour: number) => void;
  isToday: boolean;
  date: string;
  compactMode?: boolean;
}

const DroppableHour = ({
  hour,
  children,
}: {
  hour: number;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg transition-colors ${isOver ? "bg-blue-100" : ""}`}
    >
      {children}
    </div>
  );
};

const TodayTimeline = ({
  schedules,
  isLoading,
  onTimeClick,
  isToday,
  date,
  compactMode = false,
}: ITodayTimelineProps) => {
  const now = new Date();
  const currentHour = now.getHours();
  const queryClient = useQueryClient();
  const [activeDragItem, setActiveDragItem] = useState(null);

  // Configure sensors for both mouse and touch with activation constraints
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before activating drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms delay before drag activates
        tolerance: 5, // Allow 5px of movement during delay
      },
    })
  );

  const { mutate: updateScheduleMutation } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateSchedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedulesByDate", date] });
    },
    onError: (error) => {
      console.error("Failed to update schedule:", error);
      alert("스케줄 업데이트에 실패했습니다.");
    },
  });

  const handleDragStart = (event: any) => {
    setActiveDragItem(event.active.data.current.schedule);
  };

  const handleDragEnd = (event: any) => {
    setActiveDragItem(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const scheduleToUpdate = schedules.find((s) => s.id === active.id);
      if (!scheduleToUpdate) return;

      const newHourMatch = over.id.match(/^hour-(\d+)$/);
      if (!newHourMatch) return;

      const newHour = parseInt(newHourMatch[1], 10);
      const oldDateTime = scheduleToUpdate.schedule_config.datetime;
      const timePart = oldDateTime.split("T")[1];
      const newHourPadded = String(newHour).padStart(2, "0");
      const newTime = `${newHourPadded}:${timePart.substring(3)}`;
      const newDateTime = `${date}T${newTime}`;

      if (newDateTime === oldDateTime) return;

      const updatedPayload = {
        ...scheduleToUpdate,
        schedule_config: {
          ...scheduleToUpdate.schedule_config,
          datetime: newDateTime,
        },
      };
      delete updatedPayload.id;

      updateScheduleMutation({
        id: scheduleToUpdate.id,
        data: updatedPayload,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  const getSchedulesForHour = (hour: number) => {
    return schedules
      .filter((schedule) => {
        if (schedule.schedule_config.type === "ONE_TIME") {
          const scheduleDate = new Date(schedule.schedule_config.datetime);
          return scheduleDate.getHours() === hour;
        }
        return false; // Only handle ONE_TIME for now
      })
      .sort(
        (a, b) =>
          new Date(a.schedule_config.datetime).getTime() -
          new Date(b.schedule_config.datetime).getTime(),
      );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-1 px-2">
        {hours.map((hour) => {
          const schedulesForHour = getSchedulesForHour(hour);
          const isCurrentHour = isToday && hour === currentHour;
          const isEmpty = schedulesForHour.length === 0;
          const isAMPMBoundary = hour === 0 || hour === 12;

          // Skip empty hours in compact mode, but always show current hour and AM/PM boundaries
          if (compactMode && isEmpty && !isCurrentHour && !isAMPMBoundary) {
            return null;
          }

          return (
            <DroppableHour hour={hour} key={hour}>
              <div
                className="flex gap-4 items-start py-2"
                data-hour={hour}
              >
                {isAMPMBoundary && (
                  <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent -mt-2" />
                )}
                <div
                  className={`w-20 text-right text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                    isCurrentHour
                      ? "font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md"
                      : "text-gray-500"
                  }`}
                  onClick={() => onTimeClick(hour)}
                >
                  {formatHour(hour)}
                </div>
                <div
                  className={`flex-1 border-t pt-2 ${
                    isCurrentHour
                      ? "border-blue-400 border-2"
                      : "border-gray-200"
                  }`}
                >
                  {schedulesForHour.length > 0 ? (
                    schedulesForHour.map((schedule) => (
                      <TodayScheduleCard
                        key={schedule.id}
                        queryId="todaySchedules"
                        schedule={schedule}
                        date={date}
                      />
                    ))
                  ) : (
                    <div
                      className={`${compactMode ? "h-4" : "h-8"} ${
                        isCurrentHour
                          ? "bg-blue-50 rounded"
                          : ""
                      }`}
                    ></div>
                  )}
                </div>
              </div>
            </DroppableHour>
          );
        })}
      </div>
      <DragOverlay>
        {activeDragItem ? (
          <TodayScheduleCard
            queryId="overlay"
            schedule={activeDragItem}
            date={date}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TodayTimeline;
