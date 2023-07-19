import * as https from "https";

export enum Priority {
    VERY_LOW = -1,
    BASSE = 0,
    MOYENNE = 1,
    HAUTE = 2, 
    VERY_HIGH = 3,
}

export enum Status {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    EXECUTED = "EXECUTED",
    CANCELED = "CANCELED",
}

export default class Request {
    id: string;
    url: string;
    priority: number;
    status: Status;
    private request: any;

    constructor(id: string, url: string, priority: Priority) {
        this.id = id;
        this.url = url;
        this.priority = priority;
        this.status = Status.PENDING;
    }

    public isFinished(): boolean {
        return this.status === Status.EXECUTED || this.status === Status.CANCELED;
    }

    public execute() {
        this.status = Status.IN_PROGRESS;
        return new Promise((resolve, reject) => {
            this.request = https.get(this.url, (res) => {
                this.status = Status.EXECUTED;
                resolve(res);
            }).on('error', (err) => {
                this.status = Status.CANCELED;
                if(err.message === 'socket hang up') return;
                reject(err);
            });
        });
    }

    public cancel() {
        if (this.request && !this.isFinished()) {
            this.request.abort();
            this.status = Status.CANCELED;
        }
    }
}