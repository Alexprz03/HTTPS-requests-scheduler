import { expect } from 'chai';
import Scheduler from "../src/scheduler";
import Request, { Priority, Status } from "../src/request";

let scheduler: Scheduler;

// Test pour vérifier l'exécution des requêtes dans l'ordre de priorité correct
describe("project testing", () => {

    beforeEach(() => {
        scheduler = new Scheduler();
    });

    it("Vérifier l'exécution des requêtes dans l'ordre de priorité correct", async () => {
    const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.LOW);
    const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.HIGH);
    const request3 = new Request("3", "https://api.sandbox.game/lands/92311/metadata.json", Priority.MEDIUM);

    scheduler.addRequest([request1, request2, request3]);

    await scheduler.run();    
    
    // Vérifier que les requêtes sont exécutées dans le bon ordre
    expect(scheduler.executedRequests.map((req) => req.id)).to.deep.equal(["2", "3", "1"]);
    });

    it('should add a request correctly', () => {
        const request = new Request('1', 'https://api.sandbox.game/lands/92311/metadata.json', Priority.HIGH);

        scheduler.addRequest([request]);

        expect(scheduler.pendingRequests).to.deep.equal([]);
        expect(scheduler.runningRequests).to.deep.equal([request]);
    });

    it('should run requests correctly', async () => {
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HIGH);
        const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.MEDIUM);

        scheduler.addRequest([request1, request2]);

        await scheduler.run();

        expect(scheduler.pendingRequests).to.deep.equal([]);
        expect(scheduler.runningRequests).to.deep.equal([]);
        expect(scheduler.executedRequests).to.deep.equal([request1, request2]);
    });

    it('should cancel pending request correctly', async () => {
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HIGH);
        const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.MEDIUM);

        scheduler.addRequest([request1, request2]);
        const running = scheduler.run();
        scheduler.cancelPendingRequest('2');

        await running;

        expect(request2.status).to.equal(Status.CANCELED);
        expect(scheduler.executedRequests).to.deep.equal([request1]);
    });

    it('should cancel running request correctly', async () => {
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HIGH);

        scheduler.addRequest([request1]);
        const running = scheduler.run();

        scheduler.cancelRunningRequest('1');

        await running;

        expect(request1.status).to.equal(Status.CANCELED);
        expect(scheduler.executedRequests).to.deep.equal([request1]);
    });

    it('should change priority and execute pending request if necessary', () => {
        const ordonnanceur = new Scheduler();
    
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HIGH);
        const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.HIGH);
        const request3 = new Request("3", "https://api.sandbox.game/lands/92311/metadata.json", Priority.MEDIUM);
        const request4 = new Request("4", 'https://api.sandbox.game/lands/9238/metadata.json', Priority.LOW);

        ordonnanceur.addRequest([request1, request2, request3,request4]);

        ordonnanceur.run();
        
        // Changer la priorité de la requête en attente et vérifier si elle est exécutée
        ordonnanceur.changeRequestPriority("4", Priority.HIGH);
    
        // Vérifier que la priorité de la requête en attente a été modifiée
        expect(request4.priority).to.equal(Priority.HIGH);
    
        // Vérifier que la requête en attente a été exécutée et ajoutée aux requêtes en cours
        expect(ordonnanceur.runningRequests).to.include(request4);
    
        // Vérifier que la requête en attente a été supprimée des requêtes en attente
        expect(ordonnanceur.pendingRequests).to.not.include(request4);
    });    
});