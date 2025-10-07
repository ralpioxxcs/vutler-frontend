"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import TodayTimeline from "@/components/TodayTimeline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSchedulesByDate, copySchedulesByDate } from "@/pages/api/schedule";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Input,
  Switch,
} from "@heroui/react";
import { ArrowDownIcon } from "@heroicons/react/24/outline";

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
  const router = useRouter();
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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

  const scheduleCount = useMemo(() => schedules.length, [schedules]);

  // Auto-scroll to current time on initial load
  useEffect(() => {
    if (selectedDate === getKSTDateString() && timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      // Scroll to current hour minus 2 hours for better context
      const targetHour = Math.max(0, currentHour - 2);
      const hourElement = timelineRef.current.querySelector(
        `[data-hour="${targetHour}"]`,
      );
      if (hourElement) {
        setTimeout(() => {
          hourElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [selectedDate]);

  const scrollToCurrentTime = () => {
    if (timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const hourElement = timelineRef.current.querySelector(
        `[data-hour="${currentHour}"]`,
      );
      if (hourElement) {
        hourElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleTimeClick = (hour: number) => {
    const formattedHour = String(hour).padStart(2, "0");
    const time = `${formattedHour}:00`;
    router.push(`/schedule/new?date=${selectedDate}&time=${time}`);
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
      <div className="flex justify-center items-center mb-4">
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

          <button
            onClick={() =>
              router.push(`/schedule/new?date=${selectedDate}`)
            }
            aria-label="Create new schedule"
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            <PlusIcon className="h-6 w-6" />
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

      {/* Quick Stats & Controls */}
      <div className="flex justify-between items-center px-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
            <span className="text-sm font-semibold text-blue-700">
              {scheduleCount}개 스케줄
            </span>
          </div>
          <Switch
            size="sm"
            isSelected={compactMode}
            onValueChange={setCompactMode}
          >
            <span className="text-xs text-gray-600">축약 보기</span>
          </Switch>
        </div>
        {selectedDate === getKSTDateString() && (
          <button
            onClick={scrollToCurrentTime}
            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-full hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
            aria-label="현재 시간으로 이동"
          >
            <ArrowDownIcon className="w-3 h-3" />
            현재 시간
          </button>
        )}
      </div>

      <div ref={timelineRef} className="overflow-y-auto">
        <TodayTimeline
          schedules={schedules}
          isLoading={isLoading}
          onTimeClick={handleTimeClick}
          isToday={selectedDate === getKSTDateString()}
          date={selectedDate}
          compactMode={compactMode}
        />
      </div>

      <CopyScheduleModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        sourceDate={selectedDate}
      />
    </div>
  );
}
