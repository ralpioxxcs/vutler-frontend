"use client";

import { useState, useMemo, useRef } from "react";
import TodayTimeline from "@/components/TodayTimeline";
import TodayScheduleModal from "@/components/TodayScheduleModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSchedulesByDate, copySchedulesByDate } from "@/pages/api/schedule";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Input,
} from "@heroui/react";

const CopyScheduleModal = ({
  isOpen,
  onClose,
  sourceDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  sourceDate: string;
}) => {
  const [destinationDate, setDestinationDate] = useState("");
  const queryClient = useQueryClient();

  const copyMutation = useMutation({
    mutationFn: copySchedulesByDate,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["schedulesByDate", variables.destinationDate],
      });
      alert("Schedules copied successfully!");
      onClose();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleCopy = () => {
    if (!destinationDate) {
      alert("Please select a destination date.");
      return;
    }
    copyMutation.mutate({ sourceDate, destinationDate });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>스케줄 복사하기</ModalHeader>
        <ModalBody>
          <p className="mb-2">
            <strong>{sourceDate}</strong>의 모든 스케줄을 아래 날짜로 복사합니다
          </p>
          <Input
            type="date"
            value={destinationDate}
            onChange={(e) => setDestinationDate(e.target.value)}
            className="w-full"
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            취소
          </Button>
          <Button
            color="primary"
            onPress={handleCopy}
            isLoading={copyMutation.isPending}
          >
            복사
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default function TodaySchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getKSTDateString = () => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  };

  const [selectedDate, setSelectedDate] = useState(getKSTDateString());

  const { formattedDate, dayOfWeek } = useMemo(() => {
    const date = new Date(selectedDate);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "UTC",
    };
    return {
      formattedDate: date.toLocaleDateString("ko-KR", {
        ...options,
        month: "long",
        day: "numeric",
      }),
      dayOfWeek: date.toLocaleDateString("ko-KR", {
        ...options,
        weekday: "long",
      }),
    };
  }, [selectedDate]);

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

  const changeDay = (amount: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setUTCDate(currentDate.getUTCDate() + amount);
    setSelectedDate(currentDate.toISOString().split("T")[0]);
  };

  const openDatePicker = () => {
    dateInputRef.current?.showPicker();
  };

  return (
    <div className="relative h-full py-2">
      <div className="flex justify-center items-center mb-6">
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-md dark:bg-gray-800">
          <button
            onClick={() => changeDay(-1)}
            aria-label="Previous day"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          <div
            className="text-center cursor-pointer"
            onClick={openDatePicker}
            onKeyDown={(e) => e.key === "Enter" && openDatePicker()}
            role="button"
            tabIndex={0}
          >
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              {formattedDate}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {dayOfWeek}
            </p>
          </div>

          <button
            onClick={() => changeDay(1)}
            aria-label="Next day"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={() => setIsCopyModalOpen(true)}
            aria-label="Copy schedules"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <DocumentDuplicateIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="sr-only"
            aria-hidden="true"
          />
        </div>
      </div>

      <TodayTimeline
        schedules={schedules}
        isLoading={isLoading}
        onTimeClick={handleTimeClick}
        isToday={selectedDate === getKSTDateString()}
        date={selectedDate}
      />

      {isModalOpen && (
        <TodayScheduleModal
          onClose={handleCloseModal}
          initialTime={selectedTime}
          initialDate={selectedDate}
        />
      )}

      <CopyScheduleModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        sourceDate={selectedDate}
      />
    </div>
  );
}
