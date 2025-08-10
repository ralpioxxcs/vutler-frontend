"use client";

import { useState } from "react";
import TodayTimeline from "@/components/TodayTimeline";
import TodayScheduleModal from "@/components/TodayScheduleModal";
import { useQuery } from "@tanstack/react-query";
import { getSchedulesByDate } from "@/pages/api/schedule";
import { Input } from "@heroui/react";

export default function TodaySchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["schedulesByDate", selectedDate],
    queryFn: () => getSchedulesByDate(selectedDate),
    enabled: !!selectedDate,
  });

  const handleTimeClick = (hour: number) => {
    const formattedHour = String(hour).padStart(2, "0");
    setSelectedTime(`${formattedHour}:00`);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTime(undefined);
  };

  return (
    <div className="relative h-full py-2">
      <div className="flex justify-between items-center mb-4">
        <div className="w-48">
          <Input
            type="date"
            title="select-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <TodayTimeline
        schedules={schedules}
        isLoading={isLoading}
        onTimeClick={handleTimeClick}
      />

      {isModalOpen && (
        <TodayScheduleModal
          onClose={handleCloseModal}
          initialTime={selectedTime}
          initialDate={selectedDate}
        />
      )}
    </div>
  );
}
