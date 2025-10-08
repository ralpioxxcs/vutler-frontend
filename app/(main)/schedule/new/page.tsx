'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Tabs,
} from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { createSchedule } from '@/pages/api/schedule';
import { getUserDevices } from '@/pages/api/user';
import { getYoutubeVideoInfo } from '@/pages/api/youtube';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ScheduleType } from 'Type';
import { daysOfWeek } from '@/config';

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatSeconds = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0분 0초';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}분 ${secs}초`;
};

const extractVideoId = (url: string): string | null => {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/\\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const matches = url.match(regex);
  return matches ? matches[1] : null;
};

type ActionType = 'TTS' | 'YOUTUBE';

export default function NewSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialTime = searchParams.get('time') || getCurrentTime();
  const initialDate = searchParams.get('date') || '';

  const [title, setTitle] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [actionType, setActionType] = useState<ActionType>('TTS');
  const [ttsText, setTtsText] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeVideoTitle, setYoutubeVideoTitle] = useState('');
  const [playbackRange, setPlaybackRange] = useState<[number, number]>([0, 60]);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [volume, setVolume] = useState(50);
  
  // Schedule type states
  const [scheduleType, setScheduleType] = useState<ScheduleType>('ONE_TIME');
  const [oneTimeDateTime, setOneTimeDateTime] = useState(
    initialDate && initialTime
      ? `${initialDate}T${initialTime}`
      : getCurrentDateTimeLocal()
  );
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState(initialTime);

  const startTime = playbackRange[0];
  const duration = playbackRange[1] - playbackRange[0];

  const { mutate: fetchVideoInfo, isPending: isFetchingVideoInfo } =
    useMutation({
      mutationFn: getYoutubeVideoInfo,
      onSuccess: (data) => {
        setTotalDuration(data.durationInSeconds);
        setPlaybackRange([0, data.durationInSeconds]);
        setYoutubeVideoTitle(data.title);
      },
      onError: (error) => {
        console.error('Failed to fetch video info', error);
        setTotalDuration(null);
        setYoutubeVideoTitle('');
        alert('유튜브 영상 정보를 가져오는데 실패했습니다.');
      },
    });

  const { data: devices, isLoading: isLoadingDevices } = useQuery<any>({
    queryKey: ['devices'],
    queryFn: getUserDevices,
  });

  useEffect(() => {
    if (devices?.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0].device_id);
    }
  }, [devices, selectedDevice]);

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const videoId = extractVideoId(url);
    if (videoId) {
      fetchVideoInfo(videoId);
    } else {
      setTotalDuration(null);
      setYoutubeVideoTitle('');
    }
  };

  const { mutate: saveSchedule, isPending: isSaving } = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['main'] });
      if (scheduleType === 'ONE_TIME') {
        const date = oneTimeDateTime.split('T')[0];
        queryClient.invalidateQueries({
          queryKey: ['schedulesByDate', date],
        });
      }
      alert('스케줄이 생성되었습니다!');
      router.back();
    },
    onError: (error) => {
      console.error('Failed to create schedule', error);
      alert('스케줄 생성에 실패했습니다.');
    },
  });

  const handleSave = () => {
    if (!selectedDevice) {
      alert('장치를 선택해주세요.');
      return;
    }

    if (actionType === 'TTS' && !ttsText.trim()) {
      alert('읽어줄 텍스트를 입력해주세요.');
      return;
    }

    if (actionType === 'YOUTUBE' && !youtubeUrl.trim()) {
      alert('유튜브 URL을 입력해주세요.');
      return;
    }

    if (scheduleType === 'RECURRING' && recurringDays.length === 0) {
      alert('반복할 요일을 선택해주세요.');
      return;
    }

    const actionConfig =
      actionType === 'TTS'
        ? {
          type: 'TTS',
          text: ttsText,
          deviceId: selectedDevice,
          volume,
        }
        : {
          type: 'YOUTUBE',
          url: youtubeUrl,
          startTime,
          duration,
          deviceId: selectedDevice,
          volume,
        };

    const scheduleConfig =
      scheduleType === 'ONE_TIME'
        ? {
            type: 'ONE_TIME',
            datetime: `${oneTimeDateTime}:00`,
          }
        : scheduleType === 'RECURRING'
        ? {
            type: 'RECURRING',
            days: recurringDays,
            time: executionTime,
          }
        : {
            type: 'HOURLY',
          };

    const scheduleData = {
      title: title || (actionType === 'TTS' ? ttsText : youtubeVideoTitle),
      action_config: actionConfig,
      schedule_config: scheduleConfig,
      active: true,
    };

    saveSchedule(scheduleData);
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm'>
        <div className='max-w-2xl mx-auto px-4 py-3 flex items-center justify-between'>
          <button
            onClick={() => router.back()}
            className='flex items-center gap-2 text-gray-700 hover:text-gray-900'
          >
            <ArrowLeftIcon className='w-5 h-5' />
            <span className='font-medium'>뒤로</span>
          </button>
          <h1 className='text-lg font-bold text-gray-900'>새 스케줄</h1>
          <Button
            color='primary'
            onPress={handleSave}
            isLoading={isSaving}
            startContent={!isSaving && <CheckIcon className='w-4 h-4' />}
            size='sm'
          >
            저장
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='max-w-2xl mx-auto p-4 space-y-6 pb-20'>
        {/* Schedule Type Section */}
        <div className='bg-white rounded-lg shadow-sm p-5 space-y-4'>
          <h2 className='text-lg font-semibold text-gray-800 mb-3'>
            스케줄 타입
          </h2>
          <Select
            label='언제 실행할까요?'
            selectedKeys={[scheduleType]}
            onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
            className='text-base'
          >
            <SelectItem key='ONE_TIME'>한 번만 실행 (이벤트)</SelectItem>
            <SelectItem key='RECURRING'>반복 실행 (루틴)</SelectItem>
            <SelectItem key='HOURLY'>정각마다 실행</SelectItem>
          </Select>
        </div>

        {/* Date and Time Section */}
        {scheduleType === 'ONE_TIME' && (
          <div className='bg-white rounded-lg shadow-sm p-5 space-y-4'>
            <h2 className='text-lg font-semibold text-gray-800 mb-3'>
              실행 시간
            </h2>
            <Input
              label='날짜 및 시간'
              type='datetime-local'
              value={oneTimeDateTime}
              onChange={(e) => setOneTimeDateTime(e.target.value)}
              className='text-base'
            />
          </div>
        )}

        {scheduleType === 'RECURRING' && (
          <div className='bg-white rounded-lg shadow-sm p-5 space-y-4'>
            <h2 className='text-lg font-semibold text-gray-800 mb-3'>
              반복 설정
            </h2>
            <Input
              label='실행 시간'
              type='time'
              value={executionTime}
              onChange={(e) => setExecutionTime(e.target.value)}
              className='text-base'
            />
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                반복할 요일
              </label>
              <div className='flex flex-wrap gap-2'>
                {daysOfWeek.map((day) => (
                  <Button
                    key={day}
                    size='sm'
                    color={recurringDays.includes(day) ? 'primary' : 'default'}
                    variant={recurringDays.includes(day) ? 'solid' : 'bordered'}
                    onPress={() =>
                      setRecurringDays((days) =>
                        days.includes(day)
                          ? days.filter((d) => d !== day)
                          : [...days, day]
                      )
                    }
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Title Section */}
        <div className='bg-white rounded-lg shadow-sm p-5'>
          <h2 className='text-lg font-semibold text-gray-800 mb-3'>
            스케줄 이름
          </h2>
          <Input
            placeholder='예: 점심 약속 알림'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='text-base'
            description='비워두면 자동으로 생성됩니다'
          />
        </div>

        {/* Device Section */}
        <div className='bg-white rounded-lg shadow-sm p-5'>
          <h2 className='text-lg font-semibold text-gray-800 mb-3'>
            어디서 실행할까요?
          </h2>
          {isLoadingDevices ? (
            <Spinner />
          ) : (
            <Select
              label='장치 선택'
              selectedKeys={[selectedDevice]}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className='text-base'
            >
              {devices?.map((device: any) => (
                <SelectItem key={device.device_id}>
                  {device.display_name}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>

        {/* Action Section */}
        <div className='bg-white rounded-lg shadow-sm p-5 space-y-4'>
          <h2 className='text-lg font-semibold text-gray-800 mb-3'>
            무엇을 할까요?
          </h2>
          <Tabs
            fullWidth
            selectedKey={actionType}
            onSelectionChange={(key) => setActionType(key as ActionType)}
          >
            <Tab key='TTS' title='텍스트 읽기' />
            <Tab key='YOUTUBE' title='유튜브 재생' />
          </Tabs>

          {actionType === 'TTS' && (
            <Input
              label='읽어줄 텍스트'
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              className='mt-4 text-base'
            />
          )}

          {actionType === 'YOUTUBE' && (
            <div className='mt-4 space-y-4'>
              <Input
                label='유튜브 URL'
                value={youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
              />
              {isFetchingVideoInfo && <Spinner size='sm' />}
              {youtubeVideoTitle && (
                <p className='text-sm text-gray-600'>📹 {youtubeVideoTitle}</p>
              )}
              {totalDuration !== null && (
                <div className='p-4 bg-gray-50 rounded-lg text-sm text-gray-700'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='font-medium'>재생 구간 선택</span>
                    <span className='font-semibold'>
                      {formatSeconds(duration)} / 총{' '}
                      {formatSeconds(totalDuration)}
                    </span>
                  </div>
                  <div className='px-2'>
                    <Slider
                      range
                      min={0}
                      max={totalDuration}
                      value={playbackRange}
                      onChange={(value) =>
                        setPlaybackRange(value as [number, number])
                      }
                      step={1}
                      allowCross={false}
                    />
                  </div>
                  <div className='flex justify-between text-xs mt-1'>
                    <span>{formatSeconds(playbackRange[0])}</span>
                    <span>{formatSeconds(playbackRange[1])}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volume Section */}
        <div className='bg-white rounded-lg shadow-sm p-5'>
          <h2 className='text-lg font-semibold text-gray-800 mb-3'>
            소리 크기
          </h2>
          <div className='flex items-center gap-4'>
            <input
              type='range'
              min='0'
              max='100'
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className='w-full'
            />
            <span className='w-16 text-center font-semibold text-gray-700'>
              {volume}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
