"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useState,
} from "react";
import type { ActionType, ScheduleType } from "Type";

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

type state = {
  title: string;
  selectedDevice: string;
  actionType: ActionType;
  ttsText: string;
  youtubeUrl: string;
  youtubeVideoTitle: string;
  playbackRange: [number, number];
  totalDuration: number | null;
  scheduleType: ScheduleType;
  oneTimeDate: string;
  recurringDays: string[];
  executionTime: string;
  volume: number;
};
type reducer = {
  [K in keyof state as `set${Capitalize<K>}`]: Dispatch<
    SetStateAction<state[K]>
  >;
};

type ScheduleContextType = {
  state: state;
  reducer: reducer;
};

const ScheduleContext = createContext<ScheduleContextType | null>(null);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
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

  const state = {
    title,
    selectedDevice,
    actionType,
    ttsText,
    youtubeUrl,
    youtubeVideoTitle,
    playbackRange,
    totalDuration,
    scheduleType,
    oneTimeDate,
    recurringDays,
    executionTime,
    volume,
  };

  const reducer = {
    setTitle,
    setSelectedDevice,
    setActionType,
    setTtsText,
    setYoutubeUrl,
    setYoutubeVideoTitle,
    setPlaybackRange,
    setTotalDuration,
    setScheduleType,
    setOneTimeDate,
    setRecurringDays,
    setExecutionTime,
    setVolume,
  };

  return (
    <ScheduleContext.Provider value={{ state, reducer }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context)
    throw new Error(`useSchedule must be used within ScheduleProvider`);
  return context;
};
