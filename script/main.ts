import Scheduler from '../src/scheduler';
import Request, { Priority } from '../src/request';

async function main() {
    // Create an instance
    const scheduler = new Scheduler();

    // Create 15 requests with different priorities
    const requests = [
        new Request('1', 'https://httpbin.org/get/', Priority.LOW),
        new Request('2', 'https://httpbin.org/get/', Priority.MEDIUM),
        new Request('3', 'https://httpbin.org/get/', Priority.HIGH),
        new Request('4', 'https://httpbin.org/ip/', Priority.LOW),
        new Request('5', 'https://httpbin.org/ip/', Priority.MEDIUM),
        new Request('6', 'https://httpbin.org/ip/', Priority.HIGH),
        new Request('7', 'https://api.sandbox.game/lands/9239/metadata.json/', Priority.LOW),
        new Request('8', 'https://api.sandbox.game/lands/9240/metadata.json/', Priority.MEDIUM),
        new Request('9', 'https://api.sandbox.game/lands/9238/metadata.json/', Priority.HIGH),
        new Request('10', 'https://api.sandbox.game/lands/9237/metadata.json/', Priority.LOW),
        new Request('11', 'https://api.sandbox.game/lands/9236/metadata.json/', Priority.MEDIUM),
        new Request('12', 'https://api.sandbox.game/lands/9235/metadata.json/', Priority.HIGH),
        new Request('13', 'https://api.sandbox.game/lands/9234/metadata.json/', Priority.LOW),
        new Request('14', 'https://api.sandbox.game/lands/9233/metadata.json/', Priority.MEDIUM),
        new Request('15', 'https://api.sandbox.game/lands/9232/metadata.json/', Priority.HIGH),
    ];

    // Add the requests to the scheduler
    scheduler.addRequest(requests, true);

    // Add new requests at regular intervals
    let requestId = 16;
    let number = 9000;
    setInterval(() => {
        const newRequests = [
            new Request(String(requestId), `https://api.sandbox.game/lands/${number}/metadata.json/`, Priority.HIGH),
            new Request(String(requestId + 1), `https://api.sandbox.game/lands/${number + 1}/metadata.json/`, Priority.MEDIUM),
            new Request(String(requestId + 2), `https://api.sandbox.game/lands/${number + 2}/metadata.json/`, Priority.LOW),
        ];

        scheduler.addRequest(newRequests, true);

        if (scheduler.runningRequests[0] && !scheduler.runningRequests[0].isFinished()) {
            scheduler.cancelRunningRequest(scheduler.runningRequests[0].id);
        }

        if (scheduler.pendingRequests[0]) {
            scheduler.cancelPendingRequest(scheduler.pendingRequests[0].id);
        }

        if(scheduler.pendingRequests[0]) {
            scheduler.changeRequestPriority(scheduler.pendingRequests[0].id, Priority.HIGH);
        }

        requestId += 3;
    }, 3000);  // Add new requests every 3 seconds
}

main().catch(error => console.error(error));
