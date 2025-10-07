'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/authContext';
import { updateUserProfile } from '@/pages/api/user';
import { logout } from '@/pages/api/auth';
import { useRouter } from 'next/navigation';
import { Button, Input, Spinner } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LogoutIcon from '@mui/icons-material/Logout';

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isEditing, setIsEditing] = useState(false);

  // Update fullName when user data changes
  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: { full_name: string }) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (fullName.trim()) {
      updateMutation.mutate({ full_name: fullName.trim() });
    }
  };

  const handleCancel = () => {
    setFullName(user?.full_name || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중..." />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">내 프로필</h1>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-500 text-white font-bold text-3xl flex items-center justify-center mb-3">
            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {user.full_name || '사용자'}
          </h2>
        </div>

        {/* User Info Form */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름
            </label>
            {isEditing ? (
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="이름을 입력하세요"
                startContent={<PersonIcon className="text-gray-400" />}
                disabled={updateMutation.isPending}
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <PersonIcon className="text-gray-400" />
                <span className="text-gray-900">
                  {user.full_name || '이름 없음'}
                </span>
              </div>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <EmailIcon className="text-gray-400" />
              <span className="text-gray-900">{user.email}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          {/* User ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              사용자 ID
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-gray-600 text-sm font-mono">
                {user.user_id}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={updateMutation.isPending}
                  className="flex-1"
                >
                  저장
                </Button>
                <Button
                  variant="bordered"
                  onPress={handleCancel}
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  취소
                </Button>
              </>
            ) : (
              <Button
                color="primary"
                variant="bordered"
                onPress={() => setIsEditing(true)}
                className="flex-1"
              >
                정보 수정
              </Button>
            )}
          </div>

          {/* Error Message */}
          {updateMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                정보 수정에 실패했습니다. 다시 시도해주세요.
              </p>
            </div>
          )}

          {/* Success Message */}
          {updateMutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                프로필이 성공적으로 업데이트되었습니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">계정 관리</h3>
        <p className="text-sm text-gray-600 mb-4">
          로그아웃하면 로그인 페이지로 이동합니다.
        </p>
        <Button
          color="danger"
          variant="flat"
          onPress={handleLogout}
          startContent={<LogoutIcon />}
        >
          로그아웃
        </Button>
      </div>
    </div>
  );
}
