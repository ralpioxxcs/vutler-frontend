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
  Card,
  CardBody,
} from "@heroui/react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import VolumeDownIcon from "@mui/icons-material/VolumeDown";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { updateDevice } from "@/pages/api/device";

import { UserDevice, getDeviceStatus } from "@/pages/api/user";

const formatMediaTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const MediaStatusCard = ({ deviceId }: { deviceId: string }) => {
  const {
    data: statusResponse,
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
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardBody>
          <div className="flex justify-center items-center p-8">
            <Spinner size="lg" color="primary" />
          </div>
        </CardBody>
      </Card>
    );

  if (isError || !statusResponse?.data?.media)
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardBody>
          <div className="text-center p-8 text-gray-500">
            <MusicNoteIcon className="mx-auto mb-2 text-gray-300" style={{ fontSize: "3rem" }} />
            <p>미디어 상태를 불러올 수 없습니다.</p>
          </div>
        </CardBody>
      </Card>
    );

  const { media } = statusResponse.data;
  const { is_playing, media_metadata, current_time, duration, volume, player_state } = media;
  const { title, artist, album_name, images } = media_metadata || {};
  const imageUrl = images && images.length > 0 ? images[0].url : undefined;

  if (!is_playing && player_state === "UNKNOWN") {
    return (
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardBody>
          <div className="text-center p-8 text-gray-500">
            <MusicNoteIcon className="mx-auto mb-2 text-gray-300" style={{ fontSize: "3rem" }} />
            <p>현재 재생 중인 미디어가 없습니다.</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 shadow-md">
      <CardBody>
        <div className="flex items-start gap-4 p-2">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={album_name || title || "Album cover"}
              width={100}
              height={100}
              className="rounded-lg object-cover flex-shrink-0 shadow-lg"
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-gradient-to-br from-purple-200 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
              <MusicNoteIcon className="text-white" style={{ fontSize: "3rem" }} />
            </div>
          )}
          <div className="min-w-0 flex-grow">
            <div className="flex justify-between items-start mb-2">
              <div className="min-w-0 flex-grow mr-2">
                <p className="text-base font-bold text-gray-900 truncate mb-1">
                  {title || "알 수 없는 제목"}
                </p>
                <p className="text-sm text-gray-700 truncate">
                  {artist || "알 수 없는 아티스트"}
                </p>
                {album_name && (
                  <p className="text-xs text-gray-600 truncate mt-1">{album_name}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {is_playing ? (
                  <Chip
                    color="success"
                    variant="flat"
                    size="sm"
                    startContent={<PlayCircleIcon style={{ fontSize: "1rem" }} />}
                  >
                    재생 중
                  </Chip>
                ) : (
                  <Chip
                    color="default"
                    variant="flat"
                    size="sm"
                    startContent={<PauseCircleIcon style={{ fontSize: "1rem" }} />}
                  >
                    일시정지
                  </Chip>
                )}
              </div>
            </div>
            <div className="mt-3">
              <Progress
                aria-label="Music progress"
                value={current_time || 0}
                maxValue={duration || 100}
                size="sm"
                className="w-full"
                color="primary"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>{formatMediaTime(current_time || 0)}</span>
                <span>{formatMediaTime(duration || 0)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <VolumeUpIcon style={{ fontSize: "1.2rem", marginRight: "4px" }} />
                <span className="font-medium">{Math.round(volume * 100)}%</span>
              </div>
              <Chip color="primary" variant="flat" size="sm">
                {player_state}
              </Chip>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const DeviceSettings = ({ device }: { device: UserDevice }) => {
  const queryClient = useQueryClient();

  // State for form inputs
  const [deviceName, setDeviceName] = useState(device.device_name);
  const [deviceIp, setDeviceIp] = useState(device.ip_address);
  const [volume, setVolume] = useState<number>(50);

  // Update state when the selected device changes
  useEffect(() => {
    setDeviceName(device.device_name);
    setDeviceIp(device.ip_address);
  }, [device]);

  // Query for device connection status from the new API (using id instead of device_id)
  const { data: statusResponse, isLoading: isConnLoading } = useQuery({
    queryKey: ["deviceStatus", device.id],
    queryFn: () => getDeviceStatus(device.id),
    enabled: !!device.id,
    refetchInterval: 10000, // 10초마다 연결 상태 갱신
  });

  const isConnected = statusResponse?.data?.isConnected ?? false;

  // Mutation for updating device info (name, ip, volume)
  const { mutate: updateDeviceMutation, isPending: isUpdating } = useMutation({
    mutationFn: ({
      name,
      ip,
      vol,
    }: {
      name: string;
      ip: string;
      vol: number;
    }) => updateDevice(device.device_id, name, ip, vol),
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
      <Card className="shadow-md">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <InfoOutlinedIcon fontSize="small" />
            기기 정보
          </h3>
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <label className="text-gray-600 font-medium">기기 이름</label>
              <span className="font-semibold">{device.display_name}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <label className="text-gray-600 font-medium">기기 IP</label>
              <Snippet hideCopyButton hideSymbol size="sm" className="bg-white">
                {device.ip_address}
              </Snippet>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <label className="text-gray-600 font-medium">연결 상태</label>
              {isConnLoading ? (
                <Spinner size="sm" />
              ) : isConnected ? (
                <Chip 
                  color="success" 
                  size="sm" 
                  variant="flat"
                  className="font-medium"
                >
                  연결 됨
                </Chip>
              ) : (
                <Chip 
                  color="danger" 
                  size="sm" 
                  variant="flat"
                  className="font-medium"
                >
                  연결 끊어짐
                </Chip>
              )}
            </div>
          </div>
          <Divider className="my-4" />
          <h4 className="text-md font-semibold mb-3">현재 재생 정보</h4>
          <MediaStatusCard deviceId={device.id} />
        </CardBody>
      </Card>

      {/* Device Settings Section */}
      <Card className="shadow-md">
        <CardBody className="p-6">
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
              variant="bordered"
            />
            <Input
              label="기기 IP"
              value={deviceIp}
              onValueChange={setDeviceIp}
              placeholder="변경할 기기 IP주소를 입력하세요"
              className="text-base"
              variant="bordered"
            />
            <Divider className="my-2" />
            <div>
              <label className="text-gray-700 font-medium mb-2 block">명령어 볼륨</label>
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
                color="primary"
              />
            </div>
            <Button
              onPress={handleDeviceUpdate}
              color="primary"
              className="self-end font-semibold"
              isLoading={isUpdating}
              size="lg"
            >
              {isUpdating ? "저장 중..." : "기기 정보 저장"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
