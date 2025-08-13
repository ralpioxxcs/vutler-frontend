"use client";

import React, { useEffect, useState } from "react";
import {
  Slider,
  Chip,
  Snippet,
  Input,
  Spinner,
  Button,
  Divider,
  Image,
  Progress,
} from "@heroui/react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getDeviceConnection,
  updateDevice,
  getDeviceStatus,
} from "@/pages/api/device";
import { Device } from "Type";

const formatMediaTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const MediaStatusCard = ({ deviceId }: { deviceId: string }) => {
  const {
    data: status,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["deviceStatus", deviceId],
    queryFn: () => getDeviceStatus(deviceId),
    refetchInterval: 5000, // 5초마다 상태를 다시 가져옵니다.
    enabled: !!deviceId,
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center p-4">
        <Spinner size="sm" />
      </div>
    );
  if (isError || !status)
    return (
      <div className="text-center p-4 text-gray-500">
        상태를 불러올 수 없습니다.
      </div>
    );

  const { is_playing, media_metadata, current_time, duration, volume } = status;
  const { title, artist, album_name, images } = media_metadata || {};
  const imageUrl = images && images.length > 0 ? images[0].url : undefined;

  if (!is_playing) {
    return (
      <div className="text-center p-4 text-gray-500">
        현재 재생 중인 미디어가 없습니다.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <Image
        src={imageUrl}
        alt={album_name || title}
        width={80}
        height={80}
        className="rounded-md object-cover flex-shrink-0"
        fallbackSrc={<MusicNoteIcon className="w-20 h-20 text-gray-300" />}
      />
      <div className="min-w-0 flex-grow">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">
              {title || "알 수 없는 제목"}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {artist || "알 수 없는 아티스트"}
            </p>
            <p className="text-xs text-gray-500 truncate">{album_name || ""}</p>
          </div>
          <div className="flex items-center text-xs text-gray-500 flex-shrink-0 ml-2">
            <VolumeUpIcon style={{ fontSize: "1rem", marginRight: "4px" }} />
            <span>{Math.round(volume * 100)}%</span>
          </div>
        </div>
        <div className="mt-2">
          <Progress
            aria-label="Music progress"
            value={current_time}
            maxValue={duration}
            size="sm"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatMediaTime(current_time)}</span>
            <span>{formatMediaTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DeviceSettings = ({ device }: { device: Device }) => {
  const queryClient = useQueryClient();

  // State for form inputs
  const [deviceName, setDeviceName] = useState(device.name);
  const [deviceIp, setDeviceIp] = useState(device.ip);
  const [volume, setVolume] = useState<number>(device.volume || 50);

  // Update state when the selected device changes
  useEffect(() => {
    setDeviceName(device.name);
    setDeviceIp(device.ip);
    setVolume(device.volume || 50);
  }, [device]);

  // Query for device connection status
  const { data: isConnected, isLoading: isConnLoading } = useQuery({
    queryKey: ["conn", device.deviceId],
    queryFn: async () => {
      const result = await getDeviceConnection(device.deviceId);
      return result.status === "success" ? result.data.isConnected : false;
    },
    enabled: !!device.deviceId,
  });

  // Mutation for updating device info (name, ip, volume)
  const { mutate: updateDeviceMutation, isLoading: isUpdating } = useMutation({
    mutationFn: ({
      name,
      ip,
      vol,
    }: {
      name: string;
      ip: string;
      vol: number;
    }) => updateDevice(device.deviceId, name, ip, vol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviceList"] });
      // Optionally, add a success toast/message here
    },
    onError: () => {
      // Optionally, add an error toast/message here
    },
  });

  const handleDeviceUpdate = () => {
    updateDeviceMutation({ name: deviceName, ip: deviceIp, vol: volume });
  };

  return (
    <div className="space-y-6">
      {/* Device Info Section */}
      <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <InfoOutlinedIcon fontSize="small" />
          기기 정보
        </h3>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <label className="w-24 text-gray-600">기기 이름:</label>
            <span>{device.name}</span>
          </div>
          <div className="flex items-center">
            <label className="w-24 text-gray-600">기기 IP:</label>
            <Snippet hideCopyButton hideSymbol size="sm">
              {device.ip}
            </Snippet>
          </div>
          <div className="flex items-center">
            <label className="w-24 text-gray-600">연결 상태:</label>
            {isConnLoading ? (
              <Spinner size="sm" />
            ) : isConnected ? (
              <Chip color="success" size="sm">
                연결 됨
              </Chip>
            ) : (
              <Chip color="danger" size="sm">
                연결 끊어짐
              </Chip>
            )}
          </div>
          <Divider className="my-2" />
          <h4 className="text-md font-semibold">현재 재생 정보</h4>
          <MediaStatusCard deviceId={device.deviceId} />
        </div>
      </div>

      {/* Device Settings Section */}
      <div className="p-4 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <SettingsIcon fontSize="small" />
          기기 설정
        </h3>
        <div className="flex flex-col space-y-4">
          <Input
            label="기기 이름"
            value={deviceName}
            onValueChange={setDeviceName}
            placeholder="변경할 기기 이름을 입력하세요"
            className="text-base"
          />
          <Input
            label="기기 IP"
            value={deviceIp}
            onValueChange={setDeviceIp}
            placeholder="변경할 기기 IP주소를 입력하세요"
            className="text-base"
          />
          <Divider className="my-2" />
          <div>
            <label className="text-gray-600">명령어 볼륨</label>
            <Slider
              aria-label="volume"
              className="mt-2"
              value={volume}
              onChange={(value) =>
                setVolume(Array.isArray(value) ? value[0] : value)
              }
              maxValue={100}
              minValue={1}
              step={1}
              startContent={<VolumeDownIcon />}
              endContent={<VolumeUpIcon />}
              showTooltip
            />
          </div>
          <Button
            onPress={handleDeviceUpdate}
            color="primary"
            className="self-end"
            isLoading={isUpdating}
          >
            {isUpdating ? "저장 중..." : "기기 정보 저장"}
          </Button>
        </div>
      </div>
    </div>
  );
};
