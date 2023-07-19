// request.test.js
import { expect } from 'chai';
import Request, { Priority, Status } from "../src/request";

describe('Request', () => {
    it('should create a request correctly', () => {
        const request = new Request('1', 'https://api.sandbox.game/lands/92311/metadata.json', Priority.HAUTE);

        expect(request.id).to.equal('1');
        expect(request.url).to.equal('https://api.sandbox.game/lands/92311/metadata.json');
        expect(request.priority).to.equal(Priority.HAUTE);
        expect(request.status).to.equal(Status.PENDING);
    });

    it('should set status to IN_PROGRESS when executing', () => {
        const request = new Request('1', 'https://api.sandbox.game/lands/92311/metadata.json', Priority.HAUTE);

        request.execute();

        expect(request.status).to.equal(Status.IN_PROGRESS);
    });

    it('should set status to EXECUTED after successful execution', async () => {
        const request = new Request('1', 'https://api.sandbox.game/lands/92311/metadata.json', Priority.HAUTE);

        await request.execute();

        expect(request.status).to.equal(Status.EXECUTED);
    });

    it('should set status to CANCELED after request is canceled', () => {
        const request = new Request('1', 'https://api.sandbox.game/lands/92311/metadata.json', Priority.HAUTE);

        request.execute();
        request.cancel();

        expect(request.status).to.equal(Status.CANCELED);
    });
});
