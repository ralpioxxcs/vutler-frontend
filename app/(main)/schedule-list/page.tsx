'use client';

import { useState, useMemo } from 'react';
import ScheduleCard from '@/components/schedule-card';
import { getScheduleList } from '@/pages/api/schedule';
import { Spinner, Button, Chip } from '@heroui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Schedule } from 'Type';
import {
  CalendarIcon,
  ClockIcon,
  BoltIcon,
  MicrophoneIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { YouTube } from '@mui/icons-material';

type TabType = 'upcoming' | 'past' | 'inactive';
type FilterType = 'all' | 'TTS' | 'YOUTUBE';
type ScheduleTypeFilter = 'all' | 'routine' | 'event';

export default function ScheduleList() {
  const queryId = 'main';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [actionFilter, setActionFilter] = useState<FilterType>('all');
  const [scheduleTypeFilter, setScheduleTypeFilter] =
    useState<ScheduleTypeFilter>('all');

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: () => getScheduleList(),
  });

  const {
    upcomingSchedules,
    pastSchedules,
    inactiveSchedules,
    todayCount,
    weekCount,
  } = useMemo(() => {
    if (!data)
      return {
        upcomingSchedules: [],
        pastSchedules: [],
        inactiveSchedules: [],
        todayCount: 0,
        weekCount: 0,
      };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    const upcoming: Schedule[] = [];
    const past: Schedule[] = [];
    const inactive: Schedule[] = [];
    let todaySchedules = 0;
    let weekSchedules = 0;

    data.forEach((s) => {
      if (!s.active) {
        inactive.push(s);
        return;
      }

      if (s.schedule_config.type !== 'ONE_TIME') {
        upcoming.push(s);
        weekSchedules++; // 루틴은 항상 이번주 카운트에 포함
      } else {
        if (s.schedule_config.datetime) {
          const executionTime = new Date(s.schedule_config.datetime);
          if (executionTime >= now) {
            upcoming.push(s);
            if (executionTime >= today && executionTime < weekLater) {
              weekSchedules++;
            }
            if (
              executionTime.getFullYear() === today.getFullYear() &&
              executionTime.getMonth() === today.getMonth() &&
              executionTime.getDate() === today.getDate()
            ) {
              todaySchedules++;
            }
          } else {
            past.push(s);
          }
        }
      }
    });

    upcoming.sort((a, b) => {
      const aTime = a.schedule_config?.datetime
        ? new Date(a.schedule_config.datetime).getTime()
        : Infinity;
      const bTime = b.schedule_config?.datetime
        ? new Date(b.schedule_config.datetime).getTime()
        : Infinity;
      if (aTime === Infinity && bTime === Infinity) return 0;
      return aTime - bTime;
    });
    past.sort((a, b) => {
      const aTime = a.schedule_config?.datetime
        ? new Date(a.schedule_config.datetime).getTime()
        : 0;
      const bTime = b.schedule_config?.datetime
        ? new Date(b.schedule_config.datetime).getTime()
        : 0;
      return bTime - aTime;
    });

    return {
      upcomingSchedules: upcoming,
      pastSchedules: past,
      inactiveSchedules: inactive,
      todayCount: todaySchedules,
      weekCount: weekSchedules,
    };
  }, [data]);

  const displayData = useMemo(() => {
    let data = {
      upcoming: upcomingSchedules,
      past: pastSchedules,
      inactive: inactiveSchedules,
    }[activeTab];

    // Apply action filter
    if (actionFilter !== 'all') {
      data = data.filter(
        (schedule) => schedule.action_config?.type === actionFilter,
      );
    }

    // Apply schedule type filter
    if (scheduleTypeFilter !== 'all') {
      if (scheduleTypeFilter === 'routine') {
        data = data.filter(
          (schedule) =>
            schedule.schedule_config?.type === 'RECURRING' ||
            schedule.schedule_config?.type === 'HOURLY',
        );
      } else if (scheduleTypeFilter === 'event') {
        data = data.filter(
          (schedule) => schedule.schedule_config?.type === 'ONE_TIME',
        );
      }
    }

    return data;
  }, [
    activeTab,
    upcomingSchedules,
    pastSchedules,
    inactiveSchedules,
    actionFilter,
    scheduleTypeFilter,
  ]);

  if (isLoading) {
    return (
      <div className='grow flex justify-center items-center'>
        <Spinner size='lg' label='로딩 중..' />
      </div>
    );
  }

  if (isError) {
    return <h1>Error</h1>;
  }

  const TabButtons = () => (
    <div className='flex justify-center gap-2 mb-4 border-b'>
      <Button
        variant={activeTab === 'upcoming' ? 'solid' : 'light'}
        onPress={() => setActiveTab('upcoming')}
      >
        예정
      </Button>
      <Button
        variant={activeTab === 'past' ? 'solid' : 'light'}
        onPress={() => setActiveTab('past')}
      >
        지난 기록
      </Button>
      <Button
        variant={activeTab === 'inactive' ? 'solid' : 'light'}
        onPress={() => setActiveTab('inactive')}
      >
        비활성화
      </Button>
    </div>
  );

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'upcoming':
        return '예정된 스케줄이 없습니다.';
      case 'past':
        return '지난 스케줄 기록이 없습니다.';
      case 'inactive':
        return '비활성화된 스케줄이 없습니다.';
      default:
        return '표시할 스케줄이 없습니다.';
    }
  };

  return (
    <div className='p-4 flex flex-col h-full'>
      {/* Header with Create Button */}
      <div className='flex items-center justify-between mb-4'>
        <h1 className='text-xl font-semibold'>모든 스케줄</h1>
        <Button
          color='primary'
          onPress={() => router.push('/schedule/new')}
          startContent={<PlusIcon className='w-5 h-5' />}
          className='font-semibold bg-gradient-to-tr from-slate-500 to-slate-900 hover:from-red-400 hover:to-red-900 text-white shadow-lg'
        >
          새 스케줄
        </Button>
      </div>

      {/* Stats Dashboard */}
      <div className='grid grid-cols-2 gap-3 mb-4'>
        <div className='bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200'>
          <div className='flex items-center gap-2 mb-1'>
            <CalendarIcon className='w-5 h-5 text-blue-600' />
            <span className='text-sm text-blue-800 font-medium'>오늘</span>
          </div>
          <p className='text-2xl font-bold text-blue-900'>{todayCount}</p>
          <p className='text-xs text-blue-600'>예정된 스케줄</p>
        </div>
        <div className='bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200'>
          <div className='flex items-center gap-2 mb-1'>
            <ClockIcon className='w-5 h-5 text-purple-600' />
            <span className='text-sm text-purple-800 font-medium'>이번 주</span>
          </div>
          <p className='text-2xl font-bold text-purple-900'>{weekCount}</p>
          <p className='text-xs text-purple-600'>예정된 스케줄</p>
        </div>
      </div>

      <TabButtons />

      {/* Filters */}
      {activeTab === 'upcoming' && (
        <div className='mb-4 space-y-2'>
          <div className='flex gap-2 flex-wrap'>
            <Chip
              size='sm'
              variant={scheduleTypeFilter === 'all' ? 'solid' : 'flat'}
              color={scheduleTypeFilter === 'all' ? 'primary' : 'default'}
              onClick={() => setScheduleTypeFilter('all')}
              className='cursor-pointer'
            >
              전체
            </Chip>
            <Chip
              size='sm'
              variant={scheduleTypeFilter === 'routine' ? 'solid' : 'flat'}
              color={scheduleTypeFilter === 'routine' ? 'success' : 'default'}
              onClick={() => setScheduleTypeFilter('routine')}
              className='cursor-pointer'
              startContent={<BoltIcon className='w-3 h-3' />}
            >
              루틴
            </Chip>
            <Chip
              size='sm'
              variant={scheduleTypeFilter === 'event' ? 'solid' : 'flat'}
              color={scheduleTypeFilter === 'event' ? 'secondary' : 'default'}
              onClick={() => setScheduleTypeFilter('event')}
              className='cursor-pointer'
              startContent={<CalendarIcon className='w-3 h-3' />}
            >
              이벤트
            </Chip>
          </div>
          <div className='flex gap-2 flex-wrap'>
            <Chip
              size='sm'
              variant={actionFilter === 'all' ? 'solid' : 'flat'}
              color={actionFilter === 'all' ? 'primary' : 'default'}
              onClick={() => setActionFilter('all')}
              className='cursor-pointer'
            >
              모두
            </Chip>
            <Chip
              size='sm'
              variant={actionFilter === 'TTS' ? 'solid' : 'flat'}
              color={actionFilter === 'TTS' ? 'primary' : 'default'}
              onClick={() => setActionFilter('TTS')}
              className='cursor-pointer'
              startContent={<MicrophoneIcon className='w-3 h-3' />}
            >
              TTS
            </Chip>
            <Chip
              size='sm'
              variant={actionFilter === 'YOUTUBE' ? 'solid' : 'flat'}
              color={actionFilter === 'YOUTUBE' ? 'danger' : 'default'}
              onClick={() => setActionFilter('YOUTUBE')}
              className='cursor-pointer'
              startContent={<YouTube sx={{ fontSize: 12 }} />}
            >
              YouTube
            </Chip>
          </div>
        </div>
      )}

      {displayData && displayData.length > 0 ? (
        <div className='grid grid-cols-1 gap-2 overflow-y-auto pb-4'>
          {displayData.map((schedule: Schedule) => (
            <ScheduleCard
              key={schedule.id}
              queryId={queryId}
              schedule={schedule}
            />
          ))}
        </div>
      ) : (
        <div className='grow flex flex-col justify-center items-center bg-gray-100 text-gray-800 rounded-lg min-h-[200px]'>
          <p className='text-xl text-gray-500 mb-4'>{getEmptyMessage()}</p>
          {activeTab === 'upcoming' && (
            <Button
              color='primary'
              onPress={() => router.push('/schedule/new')}
              className='font-semibold bg-gradient-to-tr from-slate-500 to-slate-900 hover:from-red-400 hover:to-red-900 text-white shadow-lg'
              startContent={<PlusIcon className='w-5 h-5' />}
            >
              첫 스케줄 만들기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
