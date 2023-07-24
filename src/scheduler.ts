import Request, { Priority, Status } from "./request";

// Scheduler class that manages requests
export default class Scheduler {
    pendingRequests: Request[];          // Array of pending requests
    runningRequests: Request[];          // Array of currently running requests
    executedRequests: string[];         // Array of executed requests
    logs: string[];                      // Logs of the requests
    responses: { [key: string]: any };   // Responses from the requests
    runPromise: Promise<void> | null;
    isRunning: boolean;

    constructor() {
        // Initialize the arrays and logs
        this.pendingRequests = [];
        this.runningRequests = [];
        this.executedRequests = [];
        this.logs = [];
        this.responses = {};
        this.runPromise = null;
        this.isRunning = false;
    }

    // Method to add new requests
    public addRequest(newRequests: Request[], print?: boolean) {
        // Throw an error if the array of requests is empty
        if (newRequests.length !== 0) {
            // Case 1: no current running requests
            if (this.runningRequests.length === 0) {
                const separatedRequests = this.separatePriorities(newRequests);
                // Execute the requests with maximum priority
                this.executeRequests(separatedRequests!.maxPriority);

                // Put the remaining requests in the pending list
                this.pendingRequests.push(...separatedRequests!.others);
            }

            // Case 2: there are running requests
            else if (this.runningRequests.length > 0) {
                const maxPriorityNewRequests = this.getMaxPriority(newRequests) 

                // Check if incoming requests have higher priority than the running ones
                if (maxPriorityNewRequests >= this.getMaxPriority(this.runningRequests)) {
                    // Process requests of very high priority
                    if(maxPriorityNewRequests === Priority.VERY_HIGH){
                        const veryLowPriorityRequests = this.runningRequests.filter((req) => req.priority === Priority.VERY_LOW);
                        // Cancel and push back to the pending list all running requests of very low priority
                        veryLowPriorityRequests.forEach((req) => {
                            req.cancel();
                            this.logRequest(`${req.id} ${req.status} (Priority: ${req.priority})`);
                            req.status = Status.PENDING;
                            this.pendingRequests.push(req);
                            this.runningRequests = this.runningRequests.filter((runningReq) => runningReq !== req);
                        });
                    }

                    const separatedRequests = this.separatePriorities(newRequests);
                    // Add the highest priority requests to running and execute them
                    this.executeRequests(separatedRequests!.maxPriority);
                    // Push the remaining requests to pending
                    this.pendingRequests.push(...separatedRequests!.others);
                }
            }
            if(!this.isRunning) {
                this.isRunning = true;
                this.runPromise = this.run(print);
            }
        }
    }

    // Method to get the response of a request
    public getResponse(requestId: string): any {
        return this.responses[requestId];
    }

    // Method to get the status of a request
    public getStatus(requestId: string): Status | null {
        // Check in the running requests
        const runningRequest = this.runningRequests.find((req) => req.id === requestId);
        if (runningRequest) {
            return runningRequest.status;
        }

        // Check in the responses array
        if (this.responses[requestId]) {
            if(this.responses[requestId] === "Request has been canceled") {
                return Status.CANCELED;
            }
            return Status.EXECUTED;
        }

        // Check in the pending requests
        const pendingRequest = this.pendingRequests.find((req) => req.id === requestId);
        if (pendingRequest) {
            return pendingRequest.status;
        }

        // Request not found
        return null;
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
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                refresh = false;
                if (print) this.print();

                // Check if any requests have been executed and if we need to update the tables
                this.runningRequests.forEach((req) => {
                    if (req.isFinished()) {
                        refresh = true;
                        // Remove the request from the running list
                        this.runningRequests = this.runningRequests.filter((request) => request.id !== req.id);
                        // Add the request to the executed list
                        this.executedRequests.push(req.id);
                    }
                });

                // If a request has been executed, we update the tables
                if (refresh) {
                    // If there are no running requests but there are pending ones
                    if (this.runningRequests.length === 0 && this.pendingRequests.length > 0) {
                        const separatedRequests = this.separatePriorities(this.pendingRequests);
                        // the scheduler runs those with the highest priority only
                        this.executeRequests(separatedRequests!.maxPriority);
                        // leaving the others still pending
                        this.pendingRequests = separatedRequests!.others;
                    }

                    // If there is at least one running request and at least one pending request
                    if (this.runningRequests.length > 0 && this.pendingRequests.length > 0) {
                        // it will execute the pending request(s) with the highest priority only if their priority(s) is higher or equal
                        if(this.getMaxPriority(this.pendingRequests) >= this.getMaxPriority(this.runningRequests)) {
                            const separatedRequests = this.separatePriorities(this.pendingRequests);
                            // Execute the requests
                            this.executeRequests(separatedRequests!.maxPriority);
                            // Remove from pending
                            this.pendingRequests = separatedRequests!.others;
                        }
                    }
                }    
                // If all requests are done, stop the checking
                if (this.pendingRequests.length === 0 && this.runningRequests.length === 0) {
                    clearInterval(interval);
                    if (print) this.print();
                    this.isRunning = false;
                    resolve();
                }
            }, 500); //Check the status of the requests every half second
        });
    }

    private logRequest(request: string) {
        this.logs.push(request);
        if(this.logs.length > 10) {
            this.logs.shift();
        }
    }

    private executeRequests(requests: Request[]): void {
        requests.forEach((req) => {
            req.execute()
                .then((response) => {
                    this.logRequest(`${req.id} ${req.status} (Priority: ${req.priority})`);
                    // Store the response
                    this.responses[req.id] = response;
                })
                .catch((error) => {
                    console.log(error);
                });
            this.runningRequests.push(req);
        });
    }
    

    // Method to get the maximum priority among a list of requests
    private getMaxPriority(requests: Request[]): number {
        if (requests.length === 0) {
            return -1;
        }

        let maxPriority = requests[0].priority;
        for (let i = 1; i < requests.length; i++) {
            if (requests[i].priority > maxPriority) {
                maxPriority = requests[i].priority;
            }
        }
    
        return maxPriority;
    }

    // Method to get the requests with the maximum priority and the others
    private separatePriorities(requests: Request[]): { maxPriority: Request[], others: Request[] } | null {
        if (requests.length === 0) {
            return null;
        }
        const maxPriority = this.getMaxPriority(requests);
        return { maxPriority: requests.filter(req => req.priority === maxPriority), others : requests.filter(req => req.priority !== maxPriority)}
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
                            this.logRequest(`${pendingRequestToUpdate.id} ${pendingRequestToUpdate.status} (Priority: ${pendingRequestToUpdate.priority})`);
                            // Store the response
                            this.responses[pendingRequestToUpdate.id] = response;
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
