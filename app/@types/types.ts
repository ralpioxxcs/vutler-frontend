declare module "Type" {
  type ActionType = "TTS" | "YOUTUBE";
  type ScheduleType = "ONE_TIME" | "RECURRING" | "HOURLY";

  type BaseSchedule = {
    id: string;
    updatedAt: string;
    createdAt: string;
    title: string;
    description: string | null;
    interval: string;
    active: boolean;
    removeOnComplete: boolean;
    startDate: string;
    endDate: string;
    tasks: Task[];
    schedule_config: {
      days: string[];
      time: string;
    };
    action_config: {
      url: string;
      text: string;
      type: ActionType;
      volume: number;
      endTime: number;
      deviceId: string;
      duration: number;
      startTime: number;
    };
  };

  interface OneTimeSchedule extends BaseSchedule {
    schedule_config: BaseSchedule["schedule_config"] & {
      type: "ONE_TIME";
      datetime: string;
    };
  }

  interface OtherSchedule extends BaseSchedule {
    schedule_config: BaseSchedule["schedule_config"] & {
      type: "RECURRING" | "HOURLY";
    };
  }

  type Schedule = OneTimeSchedule | OtherSchedule;

  type Task = {
    id: string;
    title: string;
    description: string;
    status: "pending" | "completed";
    text: string;
    language: string;
    result: any;
    attemps: number;
    userId: string;
    updatedAt: string;
    createdAt: string;
  };

  type Device = {
    deviceId: string;
    name: string;
    ip: string;
    volume: number;
  };

  type TTS = {
    id: string;
    modelName: string;
    pitch: number;
    bass: number;
    treble: number;
    reverb: number;
  };
}
