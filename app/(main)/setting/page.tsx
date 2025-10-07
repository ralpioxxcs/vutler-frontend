'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserDevices } from '@/pages/api/user';
import { Tabs, Tab, Spinner } from '@heroui/react';
import { DeviceSettings } from '@/components/device-settings';
import { AddDeviceForm } from '@/components/add-device-form';
import AddIcon from '@mui/icons-material/Add';

export default function SettingsPage() {
  const [selectedTab, setSelectedTab] = useState<string | number>('add');

  const {
    data: deviceList,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['deviceList'],
    queryFn: async () => {
      const result = await getUserDevices();
      console.log('Device list loaded:', result);

      // 배열인지 확인
      const devices = Array.isArray(result) ? result : [];
      if (devices.length > 0) {
        setSelectedTab(devices[0].device_id);
      }
      return devices;
    },
  });

  // 기기 추가 완료 시 해당 기기의 탭으로 전환
  const handleDeviceAdded = (deviceId: string) => {
    console.log('handleDeviceAdded called with deviceId:', deviceId);
    console.log('Current deviceList:', deviceList);
    setSelectedTab(deviceId);
  };

  if (isLoading) {
    return (
      <div className='grow flex justify-center items-center'>
        <Spinner size='lg' label='기기 목록을 불러오는 중...' />
      </div>
    );
  }

  if (isError) {
    return (
      <div className='p-4 text-center text-red-500'>
        기기 목록을 불러오는데 실패했습니다.
      </div>
    );
  }

  const selectedDevice = deviceList?.find(
    (device) => device.device_id === selectedTab,
  );

  return (
    <div className='p-4 flex flex-col'>
      <h1 className='text-xl font-semibold mb-4 text-center'>설정</h1>
      <div className='flex flex-col w-full'>
        <Tabs
          aria-label='Device settings tabs'
          selectedKey={selectedTab}
          onSelectionChange={setSelectedTab}
          color='primary'
          variant='underlined'
        >
          {deviceList?.map((device) => (
            <Tab key={device.device_id} title={device.display_name} />
          ))}
          <Tab
            key='add'
            title={
              <div className='flex items-center space-x-1'>
                <AddIcon />
                <span>기기 추가</span>
              </div>
            }
          />
        </Tabs>
        <div className='mt-4'>
          {selectedDevice ? (
            <DeviceSettings device={selectedDevice} />
          ) : selectedTab === 'add' ? (
            <AddDeviceForm onDeviceAdded={handleDeviceAdded} />
          ) : (
            <div className='text-center p-4'>기기를 선택해주세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}
