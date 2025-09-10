"use client";

import { useState, useMemo } from "react";
import { getScheduleList } from "@/pages/api/schedule";
import { Spinner, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import ScheduleFormModal from "@/components/ScheduleFormModal";
import { Mic, YouTube } from "@mui/icons-material";
import type { Schedule } from "Type";

// NOTE: API 응답과 일치하는 보다 정확한 타입을 정의했습니다.

const DashboardStats = ({
  stats,
}: {
  stats: { total: number; routines: number; events: number };
}) => (
  <div className="mb-8">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-5 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">총 스케줄</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">
          {stats.total}
        </p>
      </div>
      <div className="p-5 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">활성 루틴</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">
          {stats.routines}
        </p>
      </div>
      <div className="p-5 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-500">예정된 이벤트</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">
          {stats.events}
        </p>
      </div>
    </div>
  </div>
);

export default function Home() {
  const queryId = "main";
  const [modalSchedule, setModalSchedule] = useState<Schedule | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: () => getScheduleList(),
  });

  const stats = useMemo(() => {
    if (!data) {
      return { total: 0, routines: 0, events: 0 };
    }
    const now = new Date();
    const total = data.length;
    const activeRoutines = data.filter(
      (s) =>
        s.active &&
        (s.schedule_config?.type === "RECURRING" ||
          s.schedule_config?.type === "HOURLY"),
    ).length;
    const upcomingEvents = data.filter((s) => {
      if (!s.active) return false;
      const config = s.schedule_config;
      if (config?.type === "ONE_TIME") {
        return new Date(config.datetime) > now;
      }
      return false;
    }).length;

    return { total, routines: activeRoutines, events: upcomingEvents };
  }, [data]);

  const recentSchedules = useMemo(() => {
    if (!data) return [];
    return [...data]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 4);
  }, [data]);

  const handleQuickCreate = (schedule: Schedule) => {
    const template = { ...schedule };
    // id를 제거하여 수정 모드가 아닌 생성 모드로 전환
    delete template.id;
    // 일회성 스케줄의 경우 날짜를 현재 시간으로 초기화하도록 유도
    if (template.schedule_config?.type === "ONE_TIME") {
      delete template.schedule_config.datetime;
    }
    setModalSchedule(template);
  };

  if (isLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중.." />
      </div>
    );
  }

  if (isError) {
    return <h1>Error</h1>;
  }

  const ActionIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "TTS":
        return <Mic className="w-5 h-5 text-blue-500" />;
      case "YOUTUBE":
        return <YouTube className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 flex flex-col">
        <h1 className="text-xl font-bold mb-6 text-gray-800">스케줄 요약</h1>
        <DashboardStats stats={stats} />

        <h2 className="text-xl font-semibold mb-4">빠른 스케줄 생성</h2>
        {recentSchedules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentSchedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 bg-white rounded-lg shadow-sm border flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ActionIcon type={schedule.action_config?.type} />
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {schedule.title}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onPress={() => handleQuickCreate(schedule)}
                >
                  생성
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center bg-gray-100 text-gray-800 rounded-lg min-h-[100px]">
            <p className="text-gray-500">최근 스케줄이 없습니다.</p>
          </div>
        )}
      </div>
      {modalSchedule && (
        <ScheduleFormModal
          onClose={() => setModalSchedule(null)}
          schedule={modalSchedule}
        />
      )}
    </>
  );
}
