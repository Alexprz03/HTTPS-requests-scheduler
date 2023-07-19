import Request, { Priority, Status } from "./request";

// Scheduler class that manages requests
export default class Scheduler {
    pendingRequests: Request[];   // Array of pending requests
    runningRequests: Request[];   // Array of currently running requests
    executedRequests: Request[];  // Array of executed requests
    logs: string[];               // Logs of the requests
    responses: any[];             // Responses from the requests

    constructor() {
        // Initialize the arrays and logs
        this.pendingRequests = [];
        this.runningRequests = [];
        this.executedRequests = [];
        this.logs = [];
        this.responses = [];
    }

    // Method to add new requests
    public addRequest(newRequests: Request[]) {
        // Throw an error if the array of requests is empty
        if (newRequests.length === 0) {
            throw new Error("The array of requests is empty");
        }

        // Case 1: no current running requests
        if (this.runningRequests.length === 0) {
            const requestsWithMaxPriority = this.requestsWithMaxPriority(newRequests);
            // Execute the requests with maximum priority
            for (const req of requestsWithMaxPriority) {
                req.execute()
                .then((response) => {
                    // Log the executed request
                    this.logs.push(`${req.id} ${req.status} (Priority: ${req.priority})`);
                    // Save the response
                    this.responses.push(response);
                })
                .catch((error) => {
                    console.log(error);
                });
                this.runningRequests.push(req);
            }

            // Put the remaining requests in the pending list
            const requestsWithoutMaxPriority = this.requestsWithoutMaxPriority(newRequests);
            this.pendingRequests.push(...requestsWithoutMaxPriority);
        }

        // Case 2: there are running requests
        else if (this.runningRequests.length > 0) {
            const maxPriorityNewRequests = this.requestsWithMaxPriority(newRequests);
            const maxPriorityRunningRequests = this.getMaxPriority(this.runningRequests);

            // Check if incoming requests have higher priority than the running ones
            if (maxPriorityNewRequests[0].priority >= maxPriorityRunningRequests) {
                // Process requests of very high priority
                if(maxPriorityNewRequests[0].priority === Priority.VERY_HIGH){
                    const veryLowPriorityRequests = this.runningRequests.filter((req) => req.priority <= Priority.VERY_LOW);
                    // Cancel and push back to the pending list all running requests of very low priority
                    veryLowPriorityRequests.forEach((req) => {
                        req.cancel();
                        this.logs.push(`${req.id} ${req.status} (Priority: ${req.priority})`);
                        req.status = Status.PENDING;
                        this.pendingRequests.push(req);
                    });
                }

                // Add the highest priority requests to running and execute them
                for (const req of maxPriorityNewRequests) {
                    req.execute()
                    .then((response) => {
                        this.logs.push(`${req.id} ${req.status} (Priority: ${req.priority})`);
                        this.responses.push(response);
                    })
                    .catch((error) => {
                        console.log(error);
                    });
                    this.runningRequests.push(req);
                }

                // Push the remaining requests to pending
                const othersNewRequests = this.requestsWithoutMaxPriority(newRequests);
                this.pendingRequests.push(...othersNewRequests);
            }
        }
    }

    // Method to print the current status of the scheduler
    public print() {
        console.clear();
        console.log("List of running requests : ");
        this.runningRequests.forEach((req) => {
            console.log(req.id, " - ", req.url, " - Priority ", req.priority);
        });

        console.log("\n");
        console.log("List of pending requests : ");
        this.pendingRequests.forEach((req) => {
            console.log(req.id, " - ", req.url, " - Priority ", req.priority);
        })

        console.log("\n");
        console.log("Logs: ");
        this.logs.forEach((str) => {
            console.log(str);
        })
    }

    // Public method to run the scheduler
    public async run(print?: boolean): Promise<void> {
        let refresh:boolean;
        const logs: string[] = [];
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                refresh = false;
                if (print) this.print();

                // Check if any requests have been executed and if we need to update the tables
                this.runningRequests.forEach((req, index) => {
                    if (req.isFinished()) {
                        refresh = true;
                        // Remove the request from the running list
                        const executedRequest = this.runningRequests.splice(index, 1)[0];
                        // Add the request to the executed list
                        this.executedRequests.push(executedRequest);
                    }
                });

                // If a request has been executed, we update the tables
                if (refresh) {
                    // If there are no running requests but there are pending ones
                    if (this.runningRequests.length === 0 && this.pendingRequests.length > 0) {
                        // the scheduler runs those with the highest priority only
                        const requestsToRun = this.requestsWithMaxPriority(this.pendingRequests);
                        requestsToRun.forEach((req) => {
                            req.execute()
                            .then((response) => {
                                this.logs.push(`${req.id} ${req.status} (Priority: ${req.priority})`);
                                this.responses.push(response);
                            })
                            .catch((error) => {
                                console.log(error);
                            });
                            this.runningRequests.push(req);
                        })
                        // leaving the others still pending
                        this.pendingRequests = this.requestsWithoutMaxPriority(this.pendingRequests);
                    }

                    // If there is at least one running request and at least one pending request
                    if (this.runningRequests.length > 0 && this.pendingRequests.length > 0) {
                        // it will execute the pending request(s) with the highest priority only if their priority(s) is higher or equal
                        if(this.getMaxPriority(this.pendingRequests) >= this.getMaxPriority(this.runningRequests)) {
                            // Execute
                            const requestsToRun = this.requestsWithMaxPriority(this.pendingRequests);
                            requestsToRun.forEach((req) => {
                                req.execute()
                                .then((response) => {
                                    this.logs.push(`${req.id} ${req.status} (Priority: ${req.priority})`);
                                    this.responses.push(response);
                                })
                                .catch((error) => {
                                    console.log(error);
                                });
                                this.runningRequests.push(req);
                            })
                            // Remove from pending
                            this.pendingRequests = this.requestsWithoutMaxPriority(this.pendingRequests);
                        }
                    }
                }    
                // If all requests are done, stop the checking
                if (this.pendingRequests.length === 0 && this.runningRequests.length === 0) {
                    clearInterval(interval);
                    if (print) this.print();
                    resolve();
                }
            }, 500); //Check the status of the requests every half second
        });
    }

    // Method to get the maximum priority among a list of requests
    private getMaxPriority(requests: Request[]): number {
        if (requests.length === 0) {
            return -1;
        }
        requests.sort((a, b) => b.priority - a.priority);
        return requests[0].priority;
    }

    // Method to get the requests with the maximum priority
    private requestsWithMaxPriority(requests: Request[]): Request[] {
        if (requests.length === 0) {
            return [];
        }
        const maxPriority = this.getMaxPriority(requests);
        return requests.filter(req => req.priority === maxPriority);
    }

    // Method to get the requests without the maximum priority
    private requestsWithoutMaxPriority(requests: Request[]): Request[] {
        if (requests.length === 0) {
            return [];
        }
        const maxPriority = this.getMaxPriority(requests);
        return requests.filter(req => req.priority !== maxPriority);
    }

    // Method to check if a specific request is currently being processed
    public isRequestInProgress(requestId: string): boolean {
        return this.runningRequests.some((req) => req.id === requestId);
    }

    // Method to check if a specific request is pending
    public isRequestPending(requestId: string): boolean {
        return this.pendingRequests.some((req) => req.id === requestId);
    }
      
    // Method to cancel a pending request
    public cancelPendingRequest(requestId: string): void {
        const pendingRequest = this.pendingRequests.find((req) => req.id === requestId);
        if(pendingRequest) {
            pendingRequest.status = Status.CANCELED;
            this.pendingRequests = this.pendingRequests.filter((req) => req.id !== requestId);
        }
        else {
            console.log("Request not found");
        }
    }

    // Method to cancel a running request
    public cancelRunningRequest(requestId: string): void {
        const requestToCancel = this.runningRequests.find((req) => req.id === requestId);
        // If the request is found and it is not finished, cancel it
        if (requestToCancel && !requestToCancel.isFinished()) {
          requestToCancel.cancel();
          // Log the canceled request
          this.logs.push(`${requestToCancel.id} ${requestToCancel.status} (Priority: ${requestToCancel.priority})`);
        } else {
          console.log("Request not found");
        }
    }

    // Method to change the priority of a request
    public changeRequestPriority(requestId: string, newPriority: Priority): void {
        // Find the request in the runningRequests array
        const requestToUpdate = this.runningRequests.find((req) => req.id === requestId);
        // If the request is found and it is running, update its priority
        if (requestToUpdate) {
            requestToUpdate.priority = newPriority;
        } 
        else {
            // If the request is not found in the running requests, find it in the pending requests
            const pendingRequestToUpdate = this.pendingRequests.find((req) => req.id === requestId);
            // If the request is found and its new priority is greater than or equal to the maximum priority of the running requests, execute it
            if (pendingRequestToUpdate) {
                pendingRequestToUpdate.priority = newPriority;
                const maxPriorityRunningRequests = this.getMaxPriority(this.runningRequests);
                if (newPriority >= maxPriorityRunningRequests) {
                    pendingRequestToUpdate.execute()
                        .then((response) => {
                            // Log the executed request
                            this.logs.push(`${pendingRequestToUpdate.id} ${pendingRequestToUpdate.status} (Priority: ${pendingRequestToUpdate.priority})`);
                            // Save the response
                            this.responses.push(response);
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                    // Add the request to the runningRequests array
                    this.runningRequests.push(pendingRequestToUpdate);
                    // Remove the request from the pendingRequests array
                    this.pendingRequests = this.pendingRequests.filter((req) => req.id !== requestId);
                }
            } else {
                console.log("Request not found");
            }
        }
    }
}
