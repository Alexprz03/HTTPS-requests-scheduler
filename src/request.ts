// Importing the https module to handle the HTTP requests
import * as https from "https";

// Define a Priority enum to handle priority levels of requests
export enum Priority {
    VERY_LOW = -1, // Very low priority level
    LOW = 0,       // Low priority level
    MEDIUM = 1,    // Medium priority level
    HIGH = 2,      // High priority level
    VERY_HIGH = 3, // Very high priority level
}

// Define a Status enum to handle status of requests
export enum Status {
    PENDING = "PENDING",       // The request is pending to be processed
    IN_PROGRESS = "IN_PROGRESS", // The request is currently being processed
    EXECUTED = "EXECUTED",     // The request has been processed
    CANCELED = "CANCELED",     // The request has been canceled
}

// The main class to handle requests
export default class Request {
    id: string;          // Unique ID of the request
    url: string;         // URL to which the request is made
    priority: number;    // Priority level of the request
    status: Status;      // Current status of the request
    private request: any; // The https request instance

    // Constructor to initialize the request object
    constructor(id: string, url: string, priority: Priority) {
        this.id = id;
        this.url = url;
        this.priority = priority;
        this.status = Status.PENDING; // By default, the status is set to pending
    }

    // Method to check if the request has been finished or not
    public isFinished(): boolean {
        return this.status === Status.EXECUTED || this.status === Status.CANCELED;
    }

    // Method to execute the request
    public execute() {
        // Set the status to in progress
        this.status = Status.IN_PROGRESS;
        // Return a promise to handle the asynchronous nature of https requests
        return new Promise((resolve, reject) => {
            // Use the https module to make a GET request to the provided URL
            this.request = https.get(this.url, (res) => {
                // Set the status to executed
                this.status = Status.EXECUTED;
                resolve(res);
            }).on('error', (err) => {
                // Set the status to canceled
                this.status = Status.CANCELED;
                if(err.message === 'socket hang up') return;
                reject(err);
            });
        });
    }

    // Method to cancel the request
    public cancel() {
        // If the request instance exists and it's not finished yet
        if (this.request && !this.isFinished()) {
            // Abort the https request and set to canceled
            this.request.abort();
            this.status = Status.CANCELED;
        }
    }
}
