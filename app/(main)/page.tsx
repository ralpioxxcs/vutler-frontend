"use client";

import { useState, useMemo } from "react";
import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { Spinner, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import CreateScheduleFab from "@/components/CreateScheduleFab";

type FilterType = "ALL" | "ROUTINE" | "EVENT";

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
  const [filter, setFilter] = useState<FilterType>("ALL");

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: getScheduleList,
  });

  const stats = useMemo(() => {
    if (!data) {
      return { total: 0, routines: 0, events: 0 };
    }
    const now = new Date();
    const total = data.length;
    const activeRoutines = data.filter(
      (s: any) => s.active && s.schedule_config?.type === "RECURRING",
    ).length;
    const upcomingEvents = data.filter((s: any) => {
      if (!s.active) return false;
      const config = s.schedule_config;
      if (config?.type === "ONE_TIME") {
        return new Date(config.datetime) > now;
      }
      if (config?.type === "HOURLY") {
        return true;
      }
      return false;
    }).length;

    return { total, routines: activeRoutines, events: upcomingEvents };
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    switch (filter) {
      case "ROUTINE":
        return data.filter((s: any) => s.schedule_config?.type === "RECURRING");
      case "EVENT":
        return data.filter(
          (s: any) =>
            s.schedule_config?.type === "ONE_TIME" ||
            s.schedule_config?.type === "HOURLY",
        );
      case "ALL":
      default:
        return data;
    }
  }, [data, filter]);

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

  const FilterButtons = () => (
    <div className="flex justify-center gap-2 mb-4">
      <Button
        variant={filter === "ALL" ? "solid" : "outline"}
        onPress={() => setFilter("ALL")}
      >
        전체
      </Button>
      <Button
        variant={filter === "ROUTINE" ? "solid" : "outline"}
        onPress={() => setFilter("ROUTINE")}
      >
        루틴
      </Button>
      <Button
        variant={filter === "EVENT" ? "solid" : "outline"}
        onPress={() => setFilter("EVENT")}
      >
        이벤트
      </Button>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 flex flex-col">
      <h1 className="text-xl font-bold mb-6 text-gray-800">스케줄 요약</h1>
      <DashboardStats stats={stats} />

      <h2 className="text-xl font-semibold mb-4 text-center">모든 스케줄</h2>
      <FilterButtons />
      {filteredData && filteredData.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {filteredData.map((schedule: any) => (
            <ScheduleCard
              key={schedule.id}
              queryId={queryId}
              schedule={schedule}
            />
          ))}
        </div>
      ) : (
        <div className="grow flex justify-center items-center bg-gray-100 text-gray-800 rounded-lg min-h-[200px]">
          <p className="text-xl text-gray-500">
            {filter === "ALL"
              ? "표시할 스케줄이 없습니다."
              : `표시할 ${
                  filter === "ROUTINE" ? "루틴" : "이벤트"
                }이(가) 없습니다.`}
          </p>
        </div>
      )}
      <CreateScheduleFab />
    </div>
  );
}
