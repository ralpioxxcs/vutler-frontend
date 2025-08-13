"use client";

import { useState, useMemo } from "react";
import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { Spinner, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import CreateScheduleFab from "@/components/CreateScheduleFab";

// NOTE: API 응답과 일치하는 보다 정확한 타입을 정의했습니다.
// 기존 app/@types/types.ts의 타입 정의와 API 응답 간에 차이가 있었습니다.
interface Schedule {
  id: string;
  title: string;
  active: boolean;
  schedule_config?: {
    type: 'RECURRING' | 'ONE_TIME' | 'HOURLY';
    datetime?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

type TabType = "upcoming" | "past" | "inactive";

export default function Home() {
  const queryId = "main";
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");

  const { data, isLoading, isError } = useQuery<Schedule[]>({
    queryKey: [queryId],
    queryFn: getScheduleList,
  });

  const { upcomingSchedules, pastSchedules, inactiveSchedules } = useMemo(() => {
    if (!data) return { upcomingSchedules: [], pastSchedules: [], inactiveSchedules: [] };

    const now = new Date();
    const upcoming: Schedule[] = [];
    const past: Schedule[] = [];
    const inactive: Schedule[] = [];

    data.forEach(s => {
      if (!s.active) {
        inactive.push(s);
        return;
      }

      if (s.schedule_config?.type === 'RECURRING' || s.schedule_config?.type === 'HOURLY') {
        upcoming.push(s); // 루틴과 시간별 스케줄은 항상 '예정'으로 간주합니다.
      } else if (s.schedule_config?.datetime) {
        const executionTime = new Date(s.schedule_config.datetime);
        if (executionTime >= now) {
          upcoming.push(s);
        } else {
          past.push(s);
        }
      }
    });
    
    // 날짜/시간을 기준으로 스케줄을 정렬합니다.
    upcoming.sort((a, b) => {
        const aTime = a.schedule_config?.datetime ? new Date(a.schedule_config.datetime).getTime() : Infinity;
        const bTime = b.schedule_config?.datetime ? new Date(b.schedule_config.datetime).getTime() : Infinity;
        if (aTime === Infinity && bTime === Infinity) return 0;
        return aTime - bTime;
    });
    past.sort((a, b) => {
        const aTime = a.schedule_config?.datetime ? new Date(a.schedule_config.datetime).getTime() : 0;
        const bTime = b.schedule_config?.datetime ? new Date(b.schedule_config.datetime).getTime() : 0;
        return bTime - aTime;
    });


    return { upcomingSchedules: upcoming, pastSchedules: past, inactiveSchedules: inactive };
  }, [data]);

  const displayData = {
    upcoming: upcomingSchedules,
    past: pastSchedules,
    inactive: inactiveSchedules,
  }[activeTab];

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

  const TabButtons = () => (
    <div className="flex justify-center gap-2 mb-4 border-b">
      <Button variant={activeTab === 'upcoming' ? 'solid' : 'light'} onPress={() => setActiveTab('upcoming')}>예정</Button>
      <Button variant={activeTab === 'past' ? 'solid' : 'light'} onPress={() => setActiveTab('past')}>지난 기록</Button>
      <Button variant={activeTab === 'inactive' ? 'solid' : 'light'} onPress={() => setActiveTab('inactive')}>비활성화</Button>
    </div>
  );

  const getEmptyMessage = () => {
    switch(activeTab) {
      case 'upcoming': return '예정된 스케줄이 없습니다.';
      case 'past': return '지난 스케줄 기록이 없습니다.';
      case 'inactive': return '비활성화된 스케줄이 없습니다.';
      default: return '표시할 스케줄이 없습니다.';
    }
  }

  return (
    <div className="p-4 flex flex-col h-full">
      <h1 className="text-xl font-semibold mb-4 text-center">모든 스케줄</h1>
      <TabButtons />
      {displayData && displayData.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 overflow-y-auto">
          {displayData.map((schedule: Schedule) => (
            <ScheduleCard
              key={schedule.id}
              queryId={queryId}
              schedule={schedule}
            />
          ))}
        </div>
      ) : (
        <div className="grow flex justify-center items-center bg-gray-100 text-gray-800 rounded-lg min-h-[200px]">
          <p className="text-xl text-gray-500">{getEmptyMessage()}</p>
        </div>
      )}
      <CreateScheduleFab />
    </div>
  );
}
