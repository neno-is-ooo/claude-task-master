export enum TaskStatus {
    Pending = 'pending',
    Done = 'done',
    InProgress = 'in-progress',
    Review = 'review',
    Deferred = 'deferred',
    Cancelled = 'cancelled'
}

export const TASK_STATUS_OPTIONS: TaskStatus[] = [
    TaskStatus.Pending,
    TaskStatus.Done,
    TaskStatus.InProgress,
    TaskStatus.Review,
    TaskStatus.Deferred,
    TaskStatus.Cancelled
];

export function isValidTaskStatus(status: string): status is TaskStatus {
    return TASK_STATUS_OPTIONS.includes(status as TaskStatus);
}
