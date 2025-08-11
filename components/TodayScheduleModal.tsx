import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  PressEvent,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Tabs,
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

interface ITodayScheduleModalProps {
  onClose: () => void;
  schedule?: any;
  initialTime?: string;
  initialDate?: string;
}

type ActionType = "TTS" | "YOUTUBE";

export default function TodayScheduleModal({
  onClose,
  schedule,
  initialTime,
  initialDate,
}: ITodayScheduleModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!schedule;

  const [title, setTitle] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>("TTS");
  const [ttsText, setTtsText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeVideoTitle, setYoutubeVideoTitle] = useState("");
  const [playbackRange, setPlaybackRange] = useState<[number, number]>([0, 60]);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState(
    initialTime || getCurrentTime(),
  );
  const [volume, setVolume] = useState(50);

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
      if (ac?.volume) {
        setVolume(ac.volume);
      }
      if (ac?.startTime !== undefined && ac?.duration !== undefined) {
        setPlaybackRange([ac.startTime, ac.startTime + ac.duration]);
      }

      const sc = schedule.schedule_config;
      if (sc?.datetime) {
        setExecutionTime(sc.datetime.substring(11, 16));
      }

      if (ac?.type === "YOUTUBE" && ac?.url) {
        const videoId = extractVideoId(ac.url);
        if (videoId) fetchVideoInfo(videoId);
      }
    } else if (initialTime) {
      setExecutionTime(initialTime);
    }
  }, [isEditMode, schedule, initialTime, fetchVideoInfo]);

  const { data: devices, isLoading: isLoadingDevices } = useQuery<any>({
    queryKey: ["devices"],
    queryFn: getDevice,
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedulesByDate"] });
    },
  });

  const { mutate: updateMutate } = useMutation({
    mutationFn: (updatedSchedule: any) =>
      updateSchedule(schedule.id, updatedSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedulesByDate"] });
    },
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: () => deleteSchedule(schedule.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedulesByDate"] });
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

    const datePart =
      initialDate || schedule?.schedule_config?.datetime?.split("T")[0];
    if (!datePart) {
      alert("날짜 정보가 없어 스케줄을 저장할 수 없습니다.");
      return;
    }

    const schedulePayload = {
      title: finalTitle,
      schedule_config: {
        type: "ONE_TIME",
        datetime: `${datePart}T${executionTime}:00`,
      },
      action_config: {
        deviceId: selectedDevice,
        type: actionType,
        text: ttsText,
        url: youtubeUrl,
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
          {isEditMode ? "스케줄 수정" : "오늘의 스케줄 추가"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <Input
              label="실행 시간"
              type="time"
              value={executionTime}
              onChange={(e) => setExecutionTime(e.target.value)}
              className="text-base"
            />

            <Input
              label="스케줄 이름 (선택)"
              placeholder="예: 점심 약속 알림"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
            />

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-600">
                어디서 실행할까요?
              </h3>
              {isLoadingDevices ? (
                <Spinner />
              ) : (
                <Select
                  label="장치 선택"
                  selectedKeys={[selectedDevice]}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="text-base"
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
              <h3 className="text-sm font-medium mb-2 text-gray-600">
                무엇을 할까요?
              </h3>
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
          <Button
            variant="light"
            onPress={(e: PressEvent) => {
              onClose();
            }}
          >
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
