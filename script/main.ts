import Ordonnanceur from '../src/ordonnanceur';
import Request, { Priority } from '../src/request';

async function main() {
    // Créer une instance de l'ordonnanceur
    const ordonnanceur = new Ordonnanceur();

    // Créer 15 requêtes avec des priorités différentes
    const requests = [
        new Request('1', 'https://httpbin.org/get/', Priority.BASSE),
        new Request('2', 'https://httpbin.org/get/', Priority.MOYENNE),
        new Request('3', 'https://httpbin.org/get/', Priority.HAUTE),
        new Request('4', 'https://httpbin.org/ip/', Priority.BASSE),
        new Request('5', 'https://httpbin.org/ip/', Priority.MOYENNE),
        new Request('6', 'https://httpbin.org/ip/', Priority.HAUTE),
        new Request('7', 'https://api.sandbox.game/lands/9239/metadata.json/', Priority.BASSE),
        new Request('8', 'https://api.sandbox.game/lands/9240/metadata.json/', Priority.MOYENNE),
        new Request('9', 'https://api.sandbox.game/lands/9238/metadata.json/', Priority.HAUTE),
        new Request('10', 'https://api.sandbox.game/lands/9237/metadata.json/', Priority.BASSE),
        new Request('11', 'https://api.sandbox.game/lands/9236/metadata.json/', Priority.MOYENNE),
        new Request('12', 'https://api.sandbox.game/lands/9235/metadata.json/', Priority.HAUTE),
        new Request('13', 'https://api.sandbox.game/lands/9234/metadata.json/', Priority.BASSE),
        new Request('14', 'https://api.sandbox.game/lands/9233/metadata.json/', Priority.MOYENNE),
        new Request('15', 'https://api.sandbox.game/lands/9232/metadata.json/', Priority.HAUTE),
    ];

    // Ajouter les requêtes à l'ordonnanceur
    ordonnanceur.addRequest(requests);

    // Lancer l'ordonnanceur
    ordonnanceur.run(true);

    // // Ajouter de nouvelles requêtes à intervalles réguliers
    let requestId = 16;
    let number = 9000;
    setInterval(() => {
        const newRequests = [
            new Request(String(requestId), `https://api.sandbox.game/lands/${number}/metadata.json/`, Priority.HAUTE),
            new Request(String(requestId + 1), `https://api.sandbox.game/lands/${number + 1}/metadata.json/`, Priority.MOYENNE),
            new Request(String(requestId + 2), `https://api.sandbox.game/lands/${number + 2}/metadata.json/`, Priority.BASSE),
        ];

        ordonnanceur.addRequest(newRequests);

        if (ordonnanceur.runningRequests[0] && !ordonnanceur.runningRequests[0].isFinished()) {
            ordonnanceur.cancelRunningRequest(ordonnanceur.runningRequests[0].id);
        }

        if (ordonnanceur.pendingRequests[0]) {
            ordonnanceur.cancelPendingRequest(ordonnanceur.pendingRequests[0].id);
        }

        if(ordonnanceur.pendingRequests[0]) {
            ordonnanceur.changeRequestPriority(ordonnanceur.pendingRequests[0].id, Priority.HAUTE);
        }

        requestId += 3;
    }, 3000);  // Ajouter de nouvelles requêtes toutes les 3 secondes
}

main().catch(error => console.error(error));
