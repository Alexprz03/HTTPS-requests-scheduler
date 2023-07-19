# README.md

## Project: HTTPS Request Scheduler

The Request Scheduler is a TypeScript project designed to manage HTTPS requests based on their priority levels. It has two main classes, `Request` and `Scheduler`. The `Request` class represents an individual HTTPS request and the `Scheduler` manages the execution of these requests based on their priority and the rules defined.

## Installation

As a TypeScript project, you need to have Node.js and npm installed in your environment.

1. Clone the repository:

```
git clone <repository-url>
```

2. Navigate to the project directory:

```
cd <project-directory>
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

5. Run sample of script:

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

scheduler.addRequest([request1, request2]);

scheduler.run(true);
```

## API Documentation

### Request

**`constructor(id: string, url: string, priority: Priority)`**

Creates a new instance of the `Request` class.

**`isFinished(): boolean`**

Checks if the request has been executed or canceled.

**`execute()`**

Executes the HTTPS request.

**`cancel()`**

Cancels the HTTPS request.

### Scheduler

**`constructor()`**

Creates a new instance of the `Scheduler` class.

**`addRequest(newRequests: Request[])`**

Adds new requests to the scheduler.

**`run(print?: boolean): Promise<void>`**

Runs the scheduler and processes the requests.

**`isRequestInProgress(requestId: string): boolean`**

Checks if a request is currently being processed.

**`isRequestPending(requestId: string): boolean`**

Checks if a request is currently pending.

**`cancelPendingRequest(requestId: string): void`**

Cancels a pending request.

**`cancelRunningRequest(requestId: string): void`**

Cancels a running request.

**`changeRequestPriority(requestId: string, newPriority: Priority): void`**

Changes the priority of a request.

Please refer to the source code and comments for further details on how each method works.

## Contributions

Please feel free to submit issues and/or pull requests, your contributions are welcome.

## License

This project is licensed under the MIT License.