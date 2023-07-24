# README.md

## Project: HTTPS Request Scheduler

The Request Scheduler is a TypeScript project designed to manage HTTPS requests based on their priority levels. It has two main classes, `Request` and `Scheduler`. The `Request` class represents an individual HTTPS request and the `Scheduler` manages the execution of these requests based on their priority and the rules defined.

## Installation

As a TypeScript project, you need to have Node.js and npm installed in your environment.

1. Clone the repository:

```
git clone https://github.com/Alexprz03/HTTPS-requests-scheduler.git
```

2. Navigate to the project directory:

```
cd HTTPS-requests-schedule
```

3. Install the dependencies:

```
npm install
```

4. Compile the TypeScript files:

```
npm run build
```

5. Run unit tests:

```
npm run test
```

5. Run [sample of script](./script/main.ts):
*If you want to properly view the continuous output during the execution of the run(), consider enlarging the console.*

```
npm run main
```

## Usage

To create a new request, you simply need to import the `Request` class, then instantiate it with the necessary parameters. Here's how you can do it:

```ts
import Request, { Priority } from "./request";

const request = new Request("request1", "https://api.example.com", Priority.HIGH);
```

After creating your requests, you can manage them using the `Scheduler`:

```ts
import Scheduler from "./scheduler";
import Request, { Priority } from "./request";

const scheduler = new Scheduler();

const request1 = new Request("request1", "https://api.example.com", Priority.HIGH);
const request2 = new Request("request2", "https://api.example2.com", Priority.LOW);

scheduler.addRequest([request1, request2], true);
```

## API Documentation

### Request

The Request class represents an HTTP(S) GET request.

#### Constructor

- `new Request(id: string, url: string, priority: Priority): Request`: Creates a new Request object with the provided ID, URL, and priority.

#### Properties

- `id: string`: The unique ID of the request.

- `url: string`: The URL to which the request is made.

- `priority: number`: The priority level of the request.

- `status: Status`: The current status of the request.

#### Methods

- `execute(): Promise<any>`

Executes the request and returns a promise that resolves with the response when the request is complete.

- `cancel(): void`

Cancels the request if it is in progress.

- `isFinished(): boolean`

Checks if the request has been finished or canceled. Returns `true` if the request is `executed` or `canceled`; otherwise, returns `false`.


### Scheduler

#### Constructor

- `new Scheduler(): Scheduler`: Creates an instance of the Scheduler class.

#### Properties

- `pendingRequests: Request[]`: An array of pending requests.

- `runningRequests: Request[]`: An array of currently running requests.

- `executedRequests: Request[]`: An array of executed requests.

- `logs: string[]`: An array of logs containing the status and priority of requests.

- `responses: { [key: string]: any }`: A key-value of responses from the executed requests.

- `runPromise: Promise<void> | null`: A promise that represents the execution of the scheduler. It is set to null initially.

- `isRunning: boolean`: A flag that indicates whether the scheduler is currently running.

#### Public Methods

- `addRequest(newRequests: Request[]): void`

Adds new requests to the Scheduler and run the program. The requests should be provided as an array of Request objects. This method call the run() function. The optional `print` parameter, when set to `true`, prints the status of requests during execution.

- `print(): void`

Prints the current status of the Scheduler, including running and pending requests.

- `isRequestInProgress(requestId: string): boolean`

Checks if a specific request is currently being processed by the Scheduler.
Returns `true` if the request is in progress; otherwise, returns `false`.

- `isRequestPending(requestId: string): boolean`

Checks if a specific request is pending in the Scheduler. Returns `true` if the request is pending; otherwise, returns `false`.

- `cancelPendingRequest(requestId: string): void`

Cancels a pending request with the specified ID.

- `cancelRunningRequest(requestId: string): void`

Cancels a running request with the specified ID.

- `changeRequestPriority(requestId: string, newPriority: Priority): void`

Changes the priority of a request with the specified ID.

- `getStatus(requestId: string): Status | null`

Method to get the status of a request

- `getResponse(requestId: string): any`

Method to get the response of a request

#### Private Methods
These methods are meant for internal use within the class and are not typically accessed outside the class.

- `run(print?: boolean): Promise<void>`

Executes the Scheduler. Returns a promise that resolves when all requests have been executed.
The optional `print` parameter, when set to `true`, prints the status of requests during execution.

- `getMaxPriority(requests: Request[]): number ` 

Gets the maximum priority among a list of requests.

`separatePriorities(requests: Request[]): { maxPriority: Request[], others: Request[] } | null`

Return the requests with the maximum priority and the others.

*Please refer to the source code and comments for further details on how each method works.*

### Enum: Priority

The Priority enum represents the priority levels of requests.

- `Priority.VERY_LOW = -1`: Very low priority level.
- `Priority.LOW = 0`: Low priority level.
- `Priority.MEDIUM = 1`: Medium priority level.
- `Priority.HIGH = 2`: High priority level.
- `Priority.VERY_HIGH = 3`: Very high priority level.

### Enum: Status

The Status enum represents the status of requests.

- `Status.PENDING = "PENDING"`: The request is pending to be processed.
- `Status.IN_PROGRESS = "IN_PROGRESS"`: The request is currently being processed.
- `Status.EXECUTED = "EXECUTED"`: The request has been processed.
- `Status.ERROR = "ERROR"`: The request received an error.

## Conclusion

The Scheduler API provides a convenient way to manage and execute HTTP(S) GET requests in a specific order based on their priority. By following the usage instructions and utilizing the provided methods and classes, you can effectively control the execution flow of your requests.
