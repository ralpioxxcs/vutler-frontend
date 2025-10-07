"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Mic, YouTube } from "@mui/icons-material";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface TodayScheduleCardProps {
  queryId: string;
  schedule: any;
  date: string;
}

// ... (ActionBadge and ScheduleTypeBadge components remain the same)
const ActionBadge = ({ config }: { config: any }) => {
  if (!config) {
    return null;
  }

  const baseBadgeStyle =
    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold"; // Smaller padding

  switch (config.type) {
    case "TTS":
      return (
        <span className={`${baseBadgeStyle} bg-blue-100 text-blue-700`}>
          <Mic sx={{ fontSize: 12 }} /> {/* Smaller icon */}
          TTS
        </span>
      );
    case "YOUTUBE":
      return (
        <span className={`${baseBadgeStyle} bg-red-100 text-red-700`}>
          <YouTube sx={{ fontSize: 12 }} /> {/* Smaller icon */}
          YouTube
        </span>
      );
    default:
      return (
        <span className={`${baseBadgeStyle} bg-gray-100 text-gray-700`}>
          알 수 없음
        </span>
      );
  }
};

const ScheduleTypeBadge = ({ config }: { config: any }) => {
  if (!config) {
    return null;
  }

  const baseBadgeStyle =
    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold";

  switch (config.type) {
    case "ONE_TIME":
      return (
        <span className={`${baseBadgeStyle} bg-purple-100 text-purple-700`}>
          이벤트
        </span>
      );
    case "RECURRING":
    case "HOURLY":
      return (
        <span className={`${baseBadgeStyle} bg-green-100 text-green-700`}>
          루틴
        </span>
      );
    default:
      return (
        <span className={`${baseBadgeStyle} bg-gray-100 text-gray-700`}>
          알 수 없음
        </span>
      );
  }
};


export default function TodayScheduleCard({
  queryId,
  schedule,
  date,
}: TodayScheduleCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: schedule.id,
      data: { schedule }, // Pass schedule data for the drag overlay
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const handleEdit = () => {
    router.push(`/schedule/edit?id=${schedule.id}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center p-2 my-1 bg-white shadow-sm rounded-lg border transition-all duration-200 hover:shadow-md hover:border-gray-300 ${!schedule.active && "opacity-50"}`}
    >
      {/* Drag Handle - Only this part is draggable */}
      <div
        {...listeners}
        {...attributes}
        className="mr-2 p-1 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors"
        title="드래그하여 시간 변경"
      >
        <Bars3Icon className="w-4 h-4 text-gray-400" />
      </div>

      {/* Clickable content area */}
      <div
        onClick={handleEdit}
        className="flex flex-col flex-grow min-w-0 cursor-pointer"
      >
        <h2 className="text-sm font-semibold text-gray-800 truncate">
          {schedule.title}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <ScheduleTypeBadge config={schedule.schedule_config} />
          <ActionBadge config={schedule.action_config} />
        </div>
      </div>
    </div>
  );
}
