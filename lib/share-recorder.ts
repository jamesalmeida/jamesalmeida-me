// The share card's video recorder: idle, preparing, recording with progress, or
// failed. The guard is set before the first await, so a double click can't start
// two recorders.

export type RecorderState =
  | { status: "idle" }
  | { status: "preparing" }
  | { status: "recording"; progress: number }
  | { status: "failed"; message: string };

export function initialRecorder(): RecorderState {
  return { status: "idle" };
}

export function startRecorder(state: RecorderState): RecorderState {
  return state.status === "idle" || state.status === "failed" ? { status: "preparing" } : state;
}

export function recorderStarted(state: RecorderState): RecorderState {
  return state.status === "preparing" ? { status: "recording", progress: 0 } : state;
}

export function recorderProgress(state: RecorderState, progress: number): RecorderState {
  if (state.status !== "recording") return state;
  return { status: "recording", progress: Math.min(1, Math.max(0, progress)) };
}

export function recorderFailed(_state: RecorderState, message: string): RecorderState {
  return { status: "failed", message };
}

export function recorderIdle(_state: RecorderState): RecorderState {
  return { status: "idle" };
}

export function recorderBusy(state: RecorderState): boolean {
  return state.status === "preparing" || state.status === "recording";
}

export function recorderProgressPercent(state: RecorderState): number | null {
  return state.status === "recording" ? Math.round(state.progress * 100) : null;
}

export type RecorderEvent =
  | { type: "start" }
  | { type: "started" }
  | { type: "progress"; progress: number }
  | { type: "failed"; message: string }
  | { type: "idle" };

export function reduceRecorder(state: RecorderState, event: RecorderEvent): RecorderState {
  switch (event.type) {
    case "start":
      return startRecorder(state);
    case "started":
      return recorderStarted(state);
    case "progress":
      return recorderProgress(state, event.progress);
    case "failed":
      return recorderFailed(state, event.message);
    case "idle":
      return recorderIdle(state);
  }
}
