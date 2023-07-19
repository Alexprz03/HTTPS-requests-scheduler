import Request, { Priority, Status } from "./request";

export default class Ordonnanceur {
    pendingRequests: Request[];
    runningRequests: Request[];
    executedRequests: Request[];
    logs: string[];
    responses: any[];

    constructor() {
        this.pendingRequests = [];
        this.runningRequests = [];
        this.executedRequests = [];
        this.logs = [];
        this.responses = [];
    }

    public addRequest(newRequests: Request[]) {
        if (newRequests.length === 0) {
            throw new Error("The array of requests is empty");
        }

        // 1e cas requetes en cours vide
        if (this.runningRequests.length === 0) {
            const requestsWithMaxPriority = this.requestsWithMaxPriority(newRequests);
            // Executer les requetes
            for (const req of requestsWithMaxPriority) {
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

            // Placer le reste des requetes dans la file
            const requestsWithoutMaxPriority = this.requestsWithoutMaxPriority(newRequests);
            this.pendingRequests.push(...requestsWithoutMaxPriority);
        }
        // 2nd cas requetes en cours pas vide
        else if (this.runningRequests.length > 0) {
            const maxPriorityNewRequests = this.requestsWithMaxPriority(newRequests);
            const maxPriorityRunningRequests = this.getMaxPriority(this.runningRequests);

            //Ici on teste si la priorité des requetes entrantes sont sup aux actuelles
            if (maxPriorityNewRequests[0].priority >= maxPriorityRunningRequests) {
                // Traitement des requêtes de très haute priorité
                if(maxPriorityNewRequests[0].priority === Priority.VERY_HIGH){
                    const veryLowPriorityRequests = this.runningRequests.filter((req) => req.priority <= Priority.VERY_LOW);
                    // Annuler et remettre en attente toutes les requêtes en cours de très basse priorité
                    veryLowPriorityRequests.forEach((req) => {
                        req.cancel();
                        this.logs.push(`${req.id} ${req.status} (Priority: ${req.priority})`);
                        req.status = Status.PENDING;
                        this.pendingRequests.push(req);
                    });
                }

                // On ajoute la plus haute prio dans le running et on execute
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

                // On place les autres en pending
                const othersNewRequests = this.requestsWithoutMaxPriority(newRequests);
                this.pendingRequests.push(...othersNewRequests);
            }
        }
    }

    private print() {
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

    public async run(print?: boolean): Promise<void> {
        let refresh:boolean;
        const logs: string[] = [];
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                refresh = false;
                if (print) this.print();
                this.runningRequests.forEach((req, index) => {
                    if (req.isFinished()) {
                        refresh = true;
                        // Retirer la requête du tableau runningRequests
                        const executedRequest = this.runningRequests.splice(index, 1)[0];
                        // Ajouter la requête dans le tableau executedRequests
                        this.executedRequests.push(executedRequest);
                    }
                });

                if (refresh) {
                    // Si il ne reste pas de requête en cours mais qu’il y en a en attente
                    if (this.runningRequests.length === 0 && this.pendingRequests.length > 0) {
                        // l’ordonnanceur exécute celle(s) ayant la plus haute priorité seulement
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
                        // laissant les autres toujours en attente
                        this.pendingRequests = this.requestsWithoutMaxPriority(this.pendingRequests);
                    }

                    // Si il reste au moins une requête en cours et au moins une requête en attente
                    if (this.runningRequests.length > 0 && this.pendingRequests.length > 0) {
                        // exécutera la/les requête(s) en attente avec la plus haute priorité seulement si leur(s) priorité(s) est supérieure ou égale
                        if(this.getMaxPriority(this.pendingRequests) >= this.getMaxPriority(this.runningRequests)) {
                            // On execute
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
                            // On retire du pending
                            this.pendingRequests = this.requestsWithoutMaxPriority(this.pendingRequests);
                        }
                    }
                }    
                // Si toutes les requêtes sont terminées, arrêter la vérification
                if (this.pendingRequests.length === 0 && this.runningRequests.length === 0) {
                    clearInterval(interval);
                    if (print) this.print();
                    resolve();
                }
            }, 100); // Vérifie l'état des requêtes toutes les secondes
        });
    }


    private getMaxPriority(requests: Request[]): number {
        if (requests.length === 0) {
            return -1;
        }
        requests.sort((a, b) => b.priority - a.priority);
        return requests[0].priority;
    }

    private requestsWithMaxPriority(requests: Request[]): Request[] {
        if (requests.length === 0) {
            return [];
        }
        const maxPriority = this.getMaxPriority(requests);
        return requests.filter(req => req.priority === maxPriority);
    }

    private requestsWithoutMaxPriority(requests: Request[]): Request[] {
        if (requests.length === 0) {
            return [];
        }
        const maxPriority = this.getMaxPriority(requests);
        return requests.filter(req => req.priority !== maxPriority);
    }

    public isRequestInProgress(requestId: string): boolean {
        return this.runningRequests.some((req) => req.id === requestId);
    }

    public isRequestPending(requestId: string): boolean {
        return this.pendingRequests.some((req) => req.id === requestId);
    }
      
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

    public cancelRunningRequest(requestId: string): void {
        const requestToCancel = this.runningRequests.find((req) => req.id === requestId);
        if (requestToCancel && !requestToCancel.isFinished()) {
          requestToCancel.cancel();
          this.logs.push(`${requestToCancel.id} ${requestToCancel.status} (Priority: ${requestToCancel.priority})`);
        } else {
          console.log("Request not found");
        }
    }

    public changeRequestPriority(requestId: string, newPriority: Priority): void {
        const requestToUpdate = this.runningRequests.find((req) => req.id === requestId);
        // On ne change rien si la requete est deja en cours
        if (requestToUpdate) {
            requestToUpdate.priority = newPriority;
        } else {
            const pendingRequestToUpdate = this.pendingRequests.find((req) => req.id === requestId);
            // Si la nouvelle priorité est superieur ou egale à la priorité max des requetes en cours, on l'execute
            if (pendingRequestToUpdate) {
                pendingRequestToUpdate.priority = newPriority;
                const maxPriorityRunningRequests = this.getMaxPriority(this.runningRequests);
                if (newPriority >= maxPriorityRunningRequests) {
                    pendingRequestToUpdate.execute()
                        .then((response) => {
                            this.logs.push(`${pendingRequestToUpdate.id} ${pendingRequestToUpdate.status} (Priority: ${pendingRequestToUpdate.priority})`);
                            this.responses.push(response);
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                    this.runningRequests.push(pendingRequestToUpdate);
                    this.pendingRequests = this.pendingRequests.filter((req) => req.id !== requestId);
                }
            } else {
                console.log("Request not found");
            }
        }
    }
    
    
}