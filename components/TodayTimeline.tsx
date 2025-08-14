
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
}: ITodayTimelineProps) => {
  const now = new Date();
  const currentHour = now.getHours();
  const queryClient = useQueryClient();
  const [activeDragItem, setActiveDragItem] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
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
      if (
        !scheduleToUpdate ||
        scheduleToUpdate.schedule_config?.type !== "ONE_TIME"
      ) {
        return;
      }

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
        const config = schedule.schedule_config;
        if (!config) return false;

        let scheduleHour;

        if (config.type === "ONE_TIME" && config.datetime) {
          scheduleHour = new Date(config.datetime).getHours();
        } else if ((config.type === "RECURRING" || config.type === "ROUTINE") && config.time) {
          scheduleHour = parseInt(config.time.split(":")[0], 10);
        } else {
          return false;
        }

        return scheduleHour === hour;
      })
      .sort((a, b) => {
        const aConfig = a.schedule_config;
        const bConfig = b.schedule_config;

        const getSortableTime = (config: any) => {
          if (config.type === "ONE_TIME" && config.datetime) {
            return new Date(config.datetime).getTime();
          }
          if (
            (config.type === "ROUTINE" || config.type === "RECURRING") &&
            config.time
          ) {
            return new Date(`${date}T${config.time}`).getTime();
          }
          return 0;
        };

        return getSortableTime(aConfig) - getSortableTime(bConfig);
      });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {hours.map((hour) => {
          const schedulesForHour = getSchedulesForHour(hour);
          const isCurrentHour = isToday && hour === currentHour;
          return (
            <DroppableHour hour={hour} key={hour}>
              <div className="flex gap-4 items-start">
                <div
                  className={`w-16 text-right text-sm cursor-pointer hover:text-blue-600 transition-colors ${isCurrentHour ? "font-bold text-blue-500" : "text-gray-500"}`}
                  onClick={() => onTimeClick(hour)}
                >
                  {formatHour(hour)}
                </div>
                <div
                  className={`flex-1 border-t pt-2 ${isCurrentHour ? "border-blue-300" : "border-gray-200"}`}
                >
                  {schedulesForHour.length > 0 ? (
                    schedulesForHour.map((schedule) => {
                      const config = schedule.schedule_config;
                      let isPast = false;
                      if (isToday || true) {
                        const now = new Date();
                        let scheduleDate;

                        if (config.type === "ONE_TIME" && config.datetime) {
                          scheduleDate = new Date(config.datetime);
                        } else if (config.type === "RECURRING" && config.time) {
                          scheduleDate = new Date(`${date}T${config.time}`);
                        }

                        if (scheduleDate && scheduleDate < now) {
                          isPast = true;
                        }
                      }
                      return (
                        <TodayScheduleCard
                          key={schedule.id}
                          queryId="todaySchedules"
                          schedule={schedule}
                          date={date}
                          isPast={isPast}
                        />
                      );
                    })
                  ) : (
                    <div className="h-8"></div>
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
