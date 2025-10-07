"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, CardBody, Spinner, Chip } from "@heroui/react";
import { getAuthHeaders } from "@/lib/auth";
import { addUserDevice } from "@/pages/api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

type ScannedDevice = {
  device_id: string;
  device_name: string;
  device_type: string;
  friendly_name: string;
  ip_address: string;
  manufacturer: string;
  model: string;
  port: number;
  status: {
    app_display_name: string | null;
    is_active: boolean;
    is_muted: boolean;
    volume_level: number;
  };
  uuid: string;
};

type ScanResponse = {
  count: number;
  data: ScannedDevice[];
  message: string;
  status: string;
};

type AddDeviceFormProps = {
  onDeviceAdded?: (deviceId: string) => void;
};

export const AddDeviceForm = ({ onDeviceAdded }: AddDeviceFormProps) => {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ScannedDevice | null>(
    null,
  );
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const addDeviceMutation = useMutation({
    mutationFn: addUserDevice,
    onSuccess: async (data) => {
      console.log('Device added successfully:', data);
      // 성공 메시지 표시
      setShowSuccess(true);
      // Reset form state
      setScannedDevices([]);
      setSelectedDevice(null);
      
      // Refetch device list to get updated list
      await queryClient.refetchQueries({ queryKey: ["deviceList"] });
      
      // 부모 컴포넌트에 추가된 기기 ID 전달
      if (onDeviceAdded) {
        // 약간의 지연 후 탭 전환 (데이터 로드 완료 대기)
        setTimeout(() => {
          console.log('Switching to device tab:', data.device_id);
          onDeviceAdded(data.device_id);
        }, 500);
      }
    },
    onError: (error: Error) => {
      console.error('Failed to add device:', error);
      setError(`기기 추가 중 오류가 발생했습니다: ${error.message}`);
    },
  });

  // 성공 메시지 자동 숨김
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleScan = async () => {
    setIsScanning(true);
    setError("");
    setScannedDevices([]);
    setSelectedDevice(null);

    try {
      const baseURL = process.env.NEXT_PUBLIC_DEVICE_SERVER;
      const response = await fetch(`${baseURL}/v1.0/chromecast/scan`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error("스캔 요청에 실패했습니다.");
      }

      const data: ScanResponse = await response.json();

      if (data.status === "success" && data.data.length > 0) {
        setScannedDevices(data.data);
      } else {
        setError("기기를 찾을 수 없습니다. 네트워크를 확인해주세요.");
      }
    } catch (err) {
      console.error("Device scan error:", err);
      setError("기기 스캔 중 오류가 발생했습니다.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeviceSelect = (device: ScannedDevice) => {
    setSelectedDevice(device);
  };

  const handleAddDevice = async () => {
    if (!selectedDevice) return;

    try {
      await addDeviceMutation.mutateAsync({
        device_id: selectedDevice.device_id,
        display_name: selectedDevice.friendly_name,
        device_name: selectedDevice.device_name,
        device_type: selectedDevice.device_type,
        manufacturer: selectedDevice.manufacturer,
        model: selectedDevice.model,
        ip_address: selectedDevice.ip_address,
        port: selectedDevice.port.toString(),
        role: "OWNER",
      });
    } catch (err) {
      console.error("Failed to add device:", err);
    }
  };

  return (
    <div className="p-4 border border-gray-300 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">새 기기 추가</h2>

      <div className="flex flex-col space-y-4">
        <Button
          color="primary"
          onPress={handleScan}
          isLoading={isScanning}
          startContent={!isScanning && <SearchIcon />}
        >
          {isScanning ? "기기 검색 중..." : "기기 검색"}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {isScanning && (
          <div className="flex flex-col items-center justify-center py-8">
            <Spinner size="lg" />
            <p className="mt-4 text-gray-600">
              네트워크에서 기기를 검색하고 있습니다...
            </p>
          </div>
        )}

        {!isScanning && scannedDevices.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {scannedDevices.length}개의 기기를 찾았습니다. 추가할 기기를
              선택하세요.
            </p>
            {scannedDevices.map((device) => (
              <Card
                key={device.device_id}
                isPressable
                isHoverable
                onPress={() => handleDeviceSelect(device)}
                className={`${
                  selectedDevice?.device_id === device.device_id
                    ? "border-2 border-primary"
                    : ""
                }`}
              >
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {device.friendly_name}
                        </h3>
                        {selectedDevice?.device_id === device.device_id && (
                          <CheckCircleIcon className="text-primary" />
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">모델:</span>{" "}
                          {device.model}
                        </p>
                        <p>
                          <span className="font-medium">제조사:</span>{" "}
                          {device.manufacturer}
                        </p>
                        <p>
                          <span className="font-medium">IP 주소:</span>{" "}
                          {device.ip_address}
                        </p>
                        <p>
                          <span className="font-medium">타입:</span>{" "}
                          {device.device_type}
                        </p>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Chip
                          size="sm"
                          color={device.status.is_active ? "success" : "default"}
                          variant="flat"
                        >
                          {device.status.is_active ? "활성" : "비활성"}
                        </Chip>
                        {device.status.is_muted && (
                          <Chip size="sm" color="warning" variant="flat">
                            음소거
                          </Chip>
                        )}
                        <Chip size="sm" variant="flat">
                          볼륨: {Math.round(device.status.volume_level * 100)}%
                        </Chip>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {selectedDevice && (
          <Button
            color="primary"
            size="lg"
            onPress={handleAddDevice}
            isLoading={addDeviceMutation.isPending}
            className="mt-4"
          >
            {addDeviceMutation.isPending ? "기기 추가 중..." : "선택한 기기 추가"}
          </Button>
        )}

        {showSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
            기기가 성공적으로 추가되었습니다!
          </div>
        )}
      </div>
    </div>
  );
};
