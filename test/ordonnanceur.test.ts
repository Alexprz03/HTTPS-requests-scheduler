import { expect } from 'chai';
import Ordonnanceur from "../src/ordonnanceur";
import Request, { Priority, Status } from "../src/request";

let ordonnanceur: Ordonnanceur;

// Test pour vérifier l'exécution des requêtes dans l'ordre de priorité correct
describe("project testing", () => {

    beforeEach(() => {
        ordonnanceur = new Ordonnanceur();
    });

    it("Vérifier l'exécution des requêtes dans l'ordre de priorité correct", async () => {
    const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.BASSE);
    const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.HAUTE);
    const request3 = new Request("3", "https://api.sandbox.game/lands/92311/metadata.json", Priority.MOYENNE);

    ordonnanceur.addRequest([request1, request2, request3]);

    await ordonnanceur.run();    
    
    // Vérifier que les requêtes sont exécutées dans le bon ordre
    expect(ordonnanceur.executedRequests.map((req) => req.id)).to.deep.equal(["2", "3", "1"]);
    });

    it('should add a request correctly', () => {
        const request = new Request('1', 'https://api.sandbox.game/lands/92311/metadata.json', Priority.HAUTE);

        ordonnanceur.addRequest([request]);

        expect(ordonnanceur.pendingRequests).to.deep.equal([]);
        expect(ordonnanceur.runningRequests).to.deep.equal([request]);
    });

    it('should run requests correctly', async () => {
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HAUTE);
        const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.MOYENNE);

        ordonnanceur.addRequest([request1, request2]);

        await ordonnanceur.run();

        expect(ordonnanceur.pendingRequests).to.deep.equal([]);
        expect(ordonnanceur.runningRequests).to.deep.equal([]);
        expect(ordonnanceur.executedRequests).to.deep.equal([request1, request2]);
    });

    it('should cancel pending request correctly', async () => {
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HAUTE);
        const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.MOYENNE);

        ordonnanceur.addRequest([request1, request2]);
        const running = ordonnanceur.run();
        ordonnanceur.cancelPendingRequest('2');

        await running;

        expect(request2.status).to.equal(Status.CANCELED);
        expect(ordonnanceur.executedRequests).to.deep.equal([request1]);
    });

    it('should cancel running request correctly', async () => {
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HAUTE);

        ordonnanceur.addRequest([request1]);
        const running = ordonnanceur.run();

        ordonnanceur.cancelRunningRequest('1');

        await running;

        expect(request1.status).to.equal(Status.CANCELED);
        expect(ordonnanceur.executedRequests).to.deep.equal([request1]);
    });

    it('should change priority and execute pending request if necessary', () => {
        const ordonnanceur = new Ordonnanceur();
    
        const request1 = new Request("1", "https://api.sandbox.game/lands/9239/metadata.json", Priority.HAUTE);
        const request2 = new Request("2", "https://api.sandbox.game/lands/92310/metadata.json", Priority.HAUTE);
        const request3 = new Request("3", "https://api.sandbox.game/lands/92311/metadata.json", Priority.MOYENNE);
        const request4 = new Request("4", 'https://api.sandbox.game/lands/9238/metadata.json', Priority.BASSE);

        ordonnanceur.addRequest([request1, request2, request3,request4]);

        ordonnanceur.run();
        
        // Changer la priorité de la requête en attente et vérifier si elle est exécutée
        ordonnanceur.changeRequestPriority("4", Priority.HAUTE);
    
        // Vérifier que la priorité de la requête en attente a été modifiée
        expect(request4.priority).to.equal(Priority.HAUTE);
    
        // Vérifier que la requête en attente a été exécutée et ajoutée aux requêtes en cours
        expect(ordonnanceur.runningRequests).to.include(request4);
    
        // Vérifier que la requête en attente a été supprimée des requêtes en attente
        expect(ordonnanceur.pendingRequests).to.not.include(request4);
    });    
});