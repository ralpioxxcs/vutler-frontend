"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/pages/api/schedule";
import { getDevice } from "@/pages/api/device";
import { getYoutubeVideoInfo } from "@/pages/api/youtube";
import type { Device } from "Type";
import { TrashIcon } from "@heroicons/react/24/outline";

// Helper functions
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

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

interface IScheduleFormModalProps {
  onClose: () => void;
  schedule?: any;
}

type ActionType = "TTS" | "YOUTUBE";
type ScheduleType = "ONE_TIME" | "RECURRING" | "HOURLY";

export default function ScheduleFormModal({
  onClose,
  schedule,
}: IScheduleFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!schedule;

  // Form state
  const [title, setTitle] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>("TTS");
  const [ttsText, setTtsText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideoTitle, setYoutubeVideoTitle] = useState("");
  const [playbackRange, setPlaybackRange] = useState<[number, number]>([0, 60]);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("ONE_TIME");
  const [oneTimeDate, setOneTimeDate] = useState(getCurrentDateTimeLocal());
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState(getCurrentTime());
  const [volume, setVolume] = useState(50);

  const startTime = playbackRange[0];
  const duration = playbackRange[1] - playbackRange[0];

  // Mutations and Queries
  const { data: devices, isLoading: isLoadingDevices } = useQuery<any>({
    queryKey: ["devices"],
    queryFn: getDevice,
  });

  const { mutate: fetchVideoInfo, isPending: isFetchingVideoInfo } =
    useMutation({
      mutationFn: getYoutubeVideoInfo,
      onSuccess: (data) => {
        setTotalDuration(data.durationInSeconds);
        setPlaybackRange([0, data.durationInSeconds]);
        setYoutubeVideoTitle(data.title);
      },
      onError: (error) => {
        console.error("Failed to fetch video info", error);
        setTotalDuration(null);
        setYoutubeVideoTitle("");
        alert("유튜브 영상 정보를 가져오는데 실패했습니다.");
      },
    });

  useEffect(() => {
    if (isEditMode && schedule) {
      setTitle(schedule.title || "");
      const ac = schedule.action_config;
      setSelectedDevice(ac?.deviceId || "");
      setActionType(ac?.type || "TTS");
      setTtsText(ac?.text || "");
      setYoutubeUrl(ac?.url || "");
      setVolume(ac?.volume || 50);
      if (ac?.startTime !== undefined && ac?.duration !== undefined) {
        setPlaybackRange([ac.startTime, ac.startTime + ac.duration]);
      }

      const sc = schedule.schedule_config;
      setScheduleType(sc?.type || "ONE_TIME");
      setOneTimeDate(sc?.datetime || getCurrentDateTimeLocal());
      setRecurringDays(sc?.days || []);
      setExecutionTime(sc?.time || getCurrentTime());

      if (ac?.type === "YOUTUBE" && ac?.url) {
        const videoId = extractVideoId(ac.url);
        if (videoId) fetchVideoInfo(videoId);
      }
    }
  }, [isEditMode, schedule, fetchVideoInfo]);

  useEffect(() => {
    if (!isEditMode && devices?.data?.length > 0 && !selectedDevice) {
      setSelectedDevice(devices.data[0].deviceId);
    }
  }, [devices, isEditMode, selectedDevice]);

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

  const { mutate: createMutate } = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["main"] }),
  });

  const { mutate: updateMutate } = useMutation({
    mutationFn: (updatedSchedule: any) =>
      updateSchedule(schedule.id, updatedSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
      queryClient.invalidateQueries({ queryKey: ["routine"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: () => deleteSchedule(schedule.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
      queryClient.invalidateQueries({ queryKey: ["routine"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
  });

  const handleDelete = () => {
    if (window.confirm("정말로 이 스케줄을 삭제하시겠습니까?")) {
      deleteMutate();
      onClose();
    }
  };

  const handleSave = () => {
    if (!selectedDevice) {
      alert("장치를 선택해주세요.");
      return;
    }

    let finalTitle = title.trim();
    if (finalTitle === "") {
      if (actionType === "TTS") {
        finalTitle = ttsText
          ? `${ttsText.substring(0, 20)}...`
          : "새로운 TTS 알림";
      } else {
        finalTitle = youtubeVideoTitle || "YouTube 재생";
      }
    }

    let urlForPayload = youtubeUrl;
    if (actionType === "YOUTUBE") {
      const videoId = extractVideoId(youtubeUrl);
      if (videoId) {
        let url = `https://www.youtube.com/watch?v=${videoId}`;
        if (startTime > 0) {
          url += `&t=${Math.round(startTime)}s`;
        }
        urlForPayload = url;
      }
    }

    const schedulePayload = {
      title: finalTitle,
      schedule_config: {
        type: scheduleType,
        datetime: oneTimeDate,
        days: recurringDays,
        time: executionTime,
      },
      action_config: {
        deviceId: selectedDevice,
        type: actionType,
        text: ttsText,
        url: urlForPayload,
        startTime: Math.round(startTime),
        duration: Math.round(duration),
        volume: volume,
      },
      active: schedule?.active ?? true,
    };

    if (isEditMode) {
      updateMutate(schedulePayload);
    } else {
      createMutate(schedulePayload);
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} placement="center" scrollBehavior="outside">
      <ModalContent
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <ModalHeader className="flex flex-col gap-1">
          {isEditMode ? "스케줄 수정" : "새 스케줄 생성"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <Input
              label="스케줄 이름"
              placeholder="예: 퇴근 시간 알림"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-600">
                1. 어디서 실행할까요?
              </h3>
              {isLoadingDevices ? (
                <Spinner />
              ) : (
                <Select
                  label="장치 선택"
                  selectedKeys={[selectedDevice]}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                >
                  {devices?.data.map((device: Device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.name}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-600">
                2. 무엇을 할까요?
              </h3>
              <Select
                label="액션 선택"
                selectedKeys={[actionType]}
                onChange={(e) => setActionType(e.target.value as ActionType)}
              >
                <SelectItem key="TTS" value="TTS">
                  텍스트 읽어주기
                </SelectItem>
                <SelectItem key="YOUTUBE" value="YOUTUBE">
                  유튜브 재생
                </SelectItem>
              </Select>
              {actionType === "TTS" && (
                <Input
                  label="읽어줄 텍스트"
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="mt-2"
                />
              )}
              {actionType === "YOUTUBE" && (
                <div className="mt-2 space-y-2">
                  <Input
                    label="유튜브 URL"
                    value={youtubeUrl}
                    onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                  />
                  {isFetchingVideoInfo && <Spinner size="sm" />}
                  {totalDuration !== null && (
                    <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span>재생 구간 선택</span>
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
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-600">
                소리 크기
              </h3>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full"
                />
                <span className="ml-4 w-12 text-center">{volume}%</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-600">
                3. 언제 할까요?
              </h3>
              <Select
                label="스케줄 타입"
                selectedKeys={[scheduleType]}
                onChange={(e) =>
                  setScheduleType(e.target.value as ScheduleType)
                }
              >
                <SelectItem key="ONE_TIME" value="ONE_TIME">
                  한 번만 실행
                </SelectItem>
                <SelectItem key="RECURRING" value="RECURRING">
                  반복 실행
                </SelectItem>
                <SelectItem key="HOURLY" value="HOURLY">
                  정각마다 실행
                </SelectItem>
              </Select>
              {scheduleType === "ONE_TIME" && (
                <Input
                  type="datetime-local"
                  label="실행 날짜 및 시간"
                  value={oneTimeDate}
                  onChange={(e) => setOneTimeDate(e.target.value)}
                  className="mt-2"
                />
              )}
              {scheduleType === "RECURRING" && (
                <div className="mt-2 space-y-2">
                  <Input
                    type="time"
                    label="실행 시간"
                    value={executionTime}
                    onChange={(e) => setExecutionTime(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                      <Button
                        key={day}
                        size="sm"
                        variant={
                          recurringDays.includes(day) ? "solid" : "outline"
                        }
                        onPress={() =>
                          setRecurringDays((days) =>
                            days.includes(day)
                              ? days.filter((d) => d !== day)
                              : [...days, day],
                          )
                        }
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          {isEditMode && (
            <Button
              color="danger"
              variant="light"
              onPress={handleDelete}
              className="mr-auto"
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
          )}
          <Button variant="light" onPress={onClose}>
            취소
          </Button>
          <Button color="primary" onPress={handleSave}>
            {isEditMode ? "업데이트" : "저장"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
