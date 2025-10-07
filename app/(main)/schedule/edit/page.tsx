"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Tabs,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import { updateSchedule, deleteSchedule, getScheduleList } from "@/pages/api/schedule";
import { getUserDevices } from "@/pages/api/user";
import { getYoutubeVideoInfo } from "@/pages/api/youtube";
import type { Device } from "Type";
import {
  ArrowLeftIcon,
  CheckIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const formatSeconds = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0분 0초";
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

type ActionType = "TTS" | "YOUTUBE";

export default function EditSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const scheduleId = searchParams.get("id");

  const [title, setTitle] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>("TTS");
  const [ttsText, setTtsText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideoTitle, setYoutubeVideoTitle] = useState("");
  const [playbackRange, setPlaybackRange] = useState<[number, number]>([0, 60]);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState("");
  const [executionDate, setExecutionDate] = useState("");
  const [volume, setVolume] = useState(50);
  const [isLoading, setIsLoading] = useState(true);

  const startTime = playbackRange[0];
  const duration = playbackRange[1] - playbackRange[0];

  // Fetch schedule data
  const { data: schedules } = useQuery({
    queryKey: ["main"],
    queryFn: getScheduleList,
    enabled: !!scheduleId,
  });

  const schedule = schedules?.find((s: any) => s.id === scheduleId);

  const { mutate: fetchVideoInfo, isPending: isFetchingVideoInfo } =
    useMutation({
      mutationFn: getYoutubeVideoInfo,
      onSuccess: (data) => {
        setTotalDuration(data.durationInSeconds);
        setYoutubeVideoTitle(data.title);
      },
      onError: (error) => {
        console.error("Failed to fetch video info", error);
        setTotalDuration(null);
        setYoutubeVideoTitle("");
        alert("유튜브 영상 정보를 가져오는데 실패했습니다.");
      },
    });

  const { data: devices, isLoading: isLoadingDevices } = useQuery<any>({
    queryKey: ["devices"],
    queryFn: getUserDevices,
  });

  // Load schedule data
  useEffect(() => {
    if (schedule) {
      setTitle(schedule.title || "");
      const ac = schedule.action_config;
      setSelectedDevice(ac?.deviceId || "");
      setActionType(ac?.type || "TTS");
      setTtsText(ac?.text || "");
      setYoutubeUrl(ac?.url || "");
      if (ac?.volume) {
        setVolume(ac.volume);
      }
      if (ac?.startTime !== undefined && ac?.duration !== undefined) {
        setPlaybackRange([ac.startTime, ac.startTime + ac.duration]);
      }

      const sc = schedule.schedule_config;
      if (sc?.datetime) {
        const datetime = sc.datetime;
        setExecutionDate(datetime.substring(0, 10));
        setExecutionTime(datetime.substring(11, 16));
      }

      if (ac?.type === "YOUTUBE" && ac?.url) {
        const videoId = extractVideoId(ac.url);
        if (videoId) fetchVideoInfo(videoId);
      }

      setIsLoading(false);
    }
  }, [schedule, fetchVideoInfo]);

  const handleYoutubeUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const videoId = extractVideoId(url);
    if (videoId) {
      fetchVideoInfo(videoId);
    } else {
      setTotalDuration(null);
      setYoutubeVideoTitle("");
    }
  };

  const { mutate: saveSchedule, isPending: isSaving } = useMutation({
    mutationFn: (data: any) => updateSchedule(scheduleId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
      queryClient.invalidateQueries({
        queryKey: ["schedulesByDate", executionDate],
      });
      alert("스케줄이 수정되었습니다!");
      router.back();
    },
    onError: (error) => {
      console.error("Failed to update schedule", error);
      alert("스케줄 수정에 실패했습니다.");
    },
  });

  const { mutate: handleDeleteSchedule, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteSchedule(scheduleId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
      queryClient.invalidateQueries({
        queryKey: ["schedulesByDate", executionDate],
      });
      alert("스케줄이 삭제되었습니다!");
      router.back();
    },
    onError: (error) => {
      console.error("Failed to delete schedule", error);
      alert("스케줄 삭제에 실패했습니다.");
    },
  });

  const handleSave = () => {
    if (!selectedDevice) {
      alert("장치를 선택해주세요.");
      return;
    }

    if (actionType === "TTS" && !ttsText.trim()) {
      alert("읽어줄 텍스트를 입력해주세요.");
      return;
    }

    if (actionType === "YOUTUBE" && !youtubeUrl.trim()) {
      alert("유튜브 URL을 입력해주세요.");
      return;
    }

    const datetime = `${executionDate}T${executionTime}:00`;

    const actionConfig =
      actionType === "TTS"
        ? {
            type: "TTS",
            text: ttsText,
            deviceId: selectedDevice,
            volume,
          }
        : {
            type: "YOUTUBE",
            url: youtubeUrl,
            startTime,
            duration,
            deviceId: selectedDevice,
            volume,
          };

    const scheduleData = {
      title: title || (actionType === "TTS" ? ttsText : youtubeVideoTitle),
      action_config: actionConfig,
      schedule_config: {
        type: "ONE_TIME",
        datetime,
      },
      active: schedule?.active ?? true,
    };

    saveSchedule(scheduleData);
  };

  const handleDelete = () => {
    if (window.confirm("정말로 이 스케줄을 삭제하시겠습니까?")) {
      handleDeleteSchedule();
    }
  };

  if (!scheduleId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">잘못된 접근입니다.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">뒤로</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900">스케줄 수정</h1>
          <div className="flex gap-2">
            <Button
              color="danger"
              variant="light"
              onPress={handleDelete}
              isLoading={isDeleting}
              startContent={!isDeleting && <TrashIcon className="w-4 h-4" />}
              size="sm"
            >
              삭제
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={isSaving}
              startContent={!isSaving && <CheckIcon className="w-4 h-4" />}
              size="sm"
            >
              저장
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6 pb-20">
        {/* Date and Time Section */}
        <div className="bg-white rounded-lg shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            실행 시간
          </h2>
          <Input
            label="날짜"
            type="date"
            value={executionDate}
            onChange={(e) => setExecutionDate(e.target.value)}
            className="text-base"
          />
          <Input
            label="시간"
            type="time"
            value={executionTime}
            onChange={(e) => setExecutionTime(e.target.value)}
            className="text-base"
          />
        </div>

        {/* Title Section */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            스케줄 이름
          </h2>
          <Input
            placeholder="예: 점심 약속 알림"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-base"
            description="비워두면 자동으로 생성됩니다"
          />
        </div>

        {/* Device Section */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            어디서 실행할까요?
          </h2>
          {isLoadingDevices ? (
            <Spinner />
          ) : (
            <Select
              label="장치 선택"
              selectedKeys={[selectedDevice]}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="text-base"
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
        <div className="bg-white rounded-lg shadow-sm p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            무엇을 할까요?
          </h2>
          <Tabs
            fullWidth
            selectedKey={actionType}
            onSelectionChange={(key) => setActionType(key as ActionType)}
          >
            <Tab key="TTS" title="텍스트 읽기" />
            <Tab key="YOUTUBE" title="유튜브 재생" />
          </Tabs>

          {actionType === "TTS" && (
            <Input
              label="읽어줄 텍스트"
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              className="mt-4 text-base"
            />
          )}

          {actionType === "YOUTUBE" && (
            <div className="mt-4 space-y-4">
              <Input
                label="유튜브 URL"
                value={youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
              />
              {isFetchingVideoInfo && <Spinner size="sm" />}
              {youtubeVideoTitle && (
                <p className="text-sm text-gray-600">
                  📹 {youtubeVideoTitle}
                </p>
              )}
              {totalDuration !== null && (
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">재생 구간 선택</span>
                    <span className="font-semibold">
                      {formatSeconds(duration)} / 총{" "}
                      {formatSeconds(totalDuration)}
                    </span>
                  </div>
                  <div className="px-2">
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
                  <div className="flex justify-between text-xs mt-1">
                    <span>{formatSeconds(playbackRange[0])}</span>
                    <span>{formatSeconds(playbackRange[1])}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Volume Section */}
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            소리 크기
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
            <span className="w-16 text-center font-semibold text-gray-700">
              {volume}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
