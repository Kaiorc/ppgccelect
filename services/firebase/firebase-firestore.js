import { initializeApp } from "@firebase/app"
// Importing web app's Firebase configuration
import { firebaseConfig } from "./firebase-config"
// Importing from /lite can reduce the bundle size, by not bring a bunch of realtime features, but just providing
// CRUD operations reducing the time it takes to load the app
import { 
    getFirestore, 
    collection, 
    doc,
    writeBatch,
    getDocs, 
    getDoc, 
    query, 
    where, 
    setDoc,
    addDoc, 
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore/lite"

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Obtém uma instância do Firestore
const db = getFirestore(app)

// Referência para a coleção "processes" no Firestore
export const processesCollectionRef = collection(db, "processes")

// Função para obter um processo pelo ID
export async function getProcess(id) {
    // Cria uma referência ao documento com o ID fornecido
    const docRef = doc(db, "processes", id) 
    // Obtém o documento do Firestore
    const snapshot = await getDoc(docRef)
    // Retorna null caso o documento não exista
    if (!snapshot.exists()) {
        return null
    }
    
    // If we dont do it this way, the object will not have the "id" property
    return {
        ...snapshot.data(), // Retorna os dados do documento
        id: snapshot.id // Adiciona a propriedade "id" ao objeto retornado
    }
}

// Função para obter todos os processos
export async function getProcesses() {
    // Obtém todos os documentos da coleção "processes"
    const snapshot = await getDocs(processesCollectionRef) 

    const processes = snapshot.docs.map(doc => ({
        ...doc.data(), // Mapeia os dados de cada documento
        id: doc.id // Adiciona a propriedade "id" a cada objeto de processo
    }))

    // Retorna a lista de processos
    return processes 
}

// Função para obter os processos que já terminaram ou ainda não começaram
export async function getInactiveProcesses() {
    try {
        const today = new Date().toISOString().split('T')[0]; // Formato "YYYY-MM-DD"

        // 1ª Query: Processos que já terminaram
        const endedQuery = query(processesCollectionRef, where("endDate", "<", today));
        
        // 2ª Query: Processos que ainda não começaram
        const notStartedQuery = query(processesCollectionRef, where("startDate", ">", today));

        // Executa ambas as consultas
        const [endedSnapshot, notStartedSnapshot] = await Promise.all([
            getDocs(endedQuery),
            getDocs(notStartedQuery)
        ]);

        // Junta os resultados
        const closedProcesses = [
            ...endedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            ...notStartedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        ];

        return closedProcesses;
    } catch (error) {
        console.error("Erro ao obter processos fora do período de inscrição:", error);
        throw error;
    }
}

// Função para obter todos os processos ativos
export async function getActiveProcesses() {
    try {
        const today = new Date().toISOString().split('T')[0]; // Formato "YYYY-MM-DD"

        // Query para buscar processos dentro do período de inscrição
        const activeQuery = query(
            processesCollectionRef,
            where("startDate", "<=", today), // Início já ocorreu ou está acontecendo
            where("endDate", ">=", today)    // Ainda não terminou
        )

        const snapshot = await getDocs(activeQuery);

        // Mapeia os processos ativos encontrados
        const activeProcesses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return activeProcesses;
    } catch (error) {
        console.error("Erro ao obter processos ativos:", error);
        throw error;
    }
}

// Função para carregar um processo pelo ID
export async function loadProcess(id) {
    const data = await getProcess(id)
    return data
}

// Função para carregar todos os processos ativos
export async function loadActiveProcesses() {
    const data = await getActiveProcesses()
    return data
}

// Função para carregar os processos que já terminaram ou ainda não começaram
export async function loadInactiveProcesses() {
    const data = await getInactiveProcesses()
    return data
}

// Função para criar um novo processo na coleção "processes" com id gerado manualmente
export async function createProcess(data) {
    try{
        // Usa o valor de "name" como ID
        const processId = data.name
    
        // Verifica se o ID já existe para evitar conflitos
        const processDocRef = doc(processesCollectionRef, processId)
        const existingDoc = await getDoc(processDocRef)
        if (existingDoc.exists()) {
            throw new Error(`Um processo com o nome "${processId}" já existe.`)
        }
    
        // Cria o documento na coleção "processes"
        await setDoc(processDocRef, { ...data, id: processId, createdAt: serverTimestamp() })

        // Cria a sub-coleção "applications" dentro do documento do processo
        const applicationsSubCollectionRef = collection(processDocRef, "applications")
        // Cria um documento "placeholder" na sub-coleção "applications", pois o Firestore não permite
        // coleções vazias e é necessário ter pelo menos um documento para a sub-coleção existir
        await setDoc(doc(applicationsSubCollectionRef, "placeholder"), {})
        
        // Cria a sub-coleção "news" dentro do documento do processo
        const newsSubCollectionRef = collection(processDocRef, "news")
        // Cria um documento "placeholder" na sub-coleção "news", pois o Firestore não permite
        // coleções vazias e é necessário ter pelo menos um documento para a sub-coleção existir
        await setDoc(doc(newsSubCollectionRef, "placeholder"), {})

    } catch (error) {
        console.error("Erro ao criar processo:", error)
        throw error
    }
}

// Função para atualizar um processo existente pelo ID
export async function updateProcess(id, data) {
    // Função para atualizar um processo existente pelo ID
    const docRef = doc(db, "processes", id) 
    // Atualiza o documento no Firestore com os novos dados
    await updateDoc(docRef, data) 
}

// Função deleteProcess que só roda se processHasApplications retornar false
export async function deleteProcess(id) {
    // Verifica se o processo possui inscrições (exceto o "placeholder")
    const hasApplications = await processHasApplications(id);
    if (hasApplications) {
        throw new Error("Não é possível deletar o processo, pois ele possui inscrições");
    }

    // Se não possuir inscrições, prossegue com a deleção:
    const processRef = doc(db, "processes", id);
    const applicationsPlaceholderRef = doc(processRef, "applications", "placeholder");
    const newsPlaceholderRef = doc(processRef, "news", "placeholder");

    const batch = writeBatch(db);
    batch.delete(applicationsPlaceholderRef);
    batch.delete(newsPlaceholderRef);
    batch.delete(processRef);

    await batch.commit();
}

// Função para adicionar os dados do candidato a um doc na coleção "applications"
export async function addApplication(id, data, name, uid, userEmail) {
    try {
        // Usa o valor de "uid" como ID
        const applicationId = uid
    
        // Cria a referência ao documento na coleção "applications" do processo
        const applicationDocRef = doc(db, `processes/${id}/applications`, applicationId)
    
        // Adiciona o documento com os dados do candidato
        await setDoc(applicationDocRef, { candidateProvidedData: data, name: name, uid: applicationId, userEmail: userEmail, status: "Não analisada", createdAt: serverTimestamp() })
    } catch (error) {
        console.error("Erro ao adicionar aplicação:", error)
        throw error
    }
}

// Função para atualizar o campo "status" de uma inscrição
export async function updateApplicationStatus(processId, applicationId, status) {
    try {
        const applicationDocRef = doc(db, `processes/${processId}/applications`, applicationId)
        await updateDoc(applicationDocRef, { status })
    } catch (error) {
        console.error("Erro ao atualizar o status da inscrição:", error)
        throw error
    }
}

// Função para deletar uma inscrição pelo ID
export async function deleteApplication(processId, applicationId) {
    try {
        const applicationDocRef = doc(db, `processes/${processId}/applications`, applicationId)
        await deleteDoc(applicationDocRef)
    } catch (error) {
        console.error("Erro ao deletar inscrição:", error)
        throw error
    }
}

// Função para obter todas as inscrições de um processo pelo ID
export async function getApplications(processId) {
    try{
        const applicationsRef = collection(db, `processes/${processId}/applications`)
        const snapshot = await getDocs(applicationsRef)
        const filteredSnapshot = snapshot.docs.filter(doc => doc.id !== "placeholder").map(doc => doc.data())
        return filteredSnapshot
    } catch (error) {
        console.error("Erro ao obter inscrições:", error)
        throw error
    }
}

// Função para checar se existe algum documento na coleção "applications" de um processo
// seletivo que possui o ID igual ao uid do usuário
export async function userHasApplication(processId, uid) {
    try {
        // Cria uma referência à coleção "applications"
        const applicationsRef = collection(db, `processes/${processId}/applications`)
        
        // Cria uma query para buscar documentos com o ID igual ao uid do usuário
        const q = query(applicationsRef, where("__name__", "==", uid))
        
        // Executa a query
        const snapshot = await getDocs(q)
        
        // Retorna true se existir pelo menos um documento, caso contrário, false
        return !snapshot.empty
    } catch (error) {
        console.error("Erro ao verificar se o usuário já está inscrito:", error)
        throw error
    }
}

// Função para obter os processos que possuem inscrições do usuário
export async function getProcessesWithUserApplications(uid) {
    try {
        const snapshot = await getDocs(processesCollectionRef);
        const processes = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }))

        const userApplications = []

        for (const process of processes) {
            const applicationsRef = collection(db, `processes/${process.id}/applications`)
            const q = query(applicationsRef, where("__name__", "==", uid))
            const applicationSnapshot = await getDocs(q)

            if (!applicationSnapshot.empty) {
                userApplications.push(process)
            }
        }

        return userApplications
    } catch (error) {
        console.error("Erro ao obter os processos com inscrições do usuário:", error)
        throw error
    }
}

// Função para checar se um processo já possui inscrições
export async function processHasApplications(processId) {
    const applicationsRef = collection(db, `processes/${processId}/applications`)
    const snapshot = await getDocs(applicationsRef)
    
    if (snapshot.empty) {
        return false
    }

    const docs = snapshot.docs.map(doc => doc.id)
    
    const isPlaceholderOnly = docs.length === 1 && docs[0] === "placeholder"
    console.log("isPlaceholderOnly ", isPlaceholderOnly)
    return !isPlaceholderOnly
}

// Função para obter os dados da inscrição de um usuário em um processo seletivo específico
// utilizando o id do processo e o uid do usuário
export async function getUserApplication(processId, uid) {
    try {
        const applicationDocRef = doc(db, `processes/${processId}/applications`, uid)
        const snapshot = await getDoc(applicationDocRef)
        
        if (!snapshot.exists()) {
            throw new Error("Inscrição não encontrada.")
        }

        return {
            ...snapshot.data(),
            id: snapshot.id
        }
    } catch (error) {
        console.error("Erro ao obter a inscrição do usuário:", error)
        throw error
    }
}

// Função para adicionar um aviso a um processo
export async function addProcessNews(processId, publisherName, data) {
    try {
        const newsCollectionRef = collection(db, `processes/${processId}/news`)
        await addDoc(newsCollectionRef, { ...data, publisherName: publisherName, createdAt: serverTimestamp() })
    } catch (error) {
        console.error("Erro ao adicionar aviso:", error)
        throw error
    }
}

// Função para atualizar um aviso de um processo e atualizar a data de atualização
export async function updateProcessNews(processId, newsId, data) {
    try {
        const newsDocRef = doc(db, `processes/${processId}/news`, newsId)
        await updateDoc(newsDocRef, { ...data, updatedAt: serverTimestamp() })
    } catch (error) {
        console.error("Erro ao atualizar aviso:", error)
        throw error
    }
}

// Função para deletar um aviso de um processo
export async function deleteProcessNews(processId, newsId) {
    try {
        const newsDocRef = doc(db, `processes/${processId}/news`, newsId)
        await deleteDoc(newsDocRef)
    } catch (error) {
        console.error("Erro ao deletar aviso:", error)
        throw error
    }
}

// Função para obter um aviso específico de um processo
export async function getSpecificProcessNews(processId, newsId) {
    try {
        const newsDocRef = doc(db, `processes/${processId}/news`, newsId);
        const snapshot = await getDoc(newsDocRef);
        if (!snapshot.exists()) {
            throw new Error("Aviso não encontrados");
        }
        return {
            ...snapshot.data(),
            id: snapshot.id
        };
    } catch (error) {
        console.error("Erro ao obter aviso:", error);
        throw error;
    }
}

// Função para obter todos os avisos de um processo.
// Usar query pode ser mais eficiente quando se trata de grandes volumes de
// dados, pois a ordenação é feita no servidor e reduz o processamento no cliente
export async function getProcessNews(processId) {
    try {
        const newsCollectionRef = collection(db, `processes/${processId}/news`)
        const snapshot = await getDocs(newsCollectionRef)
        // Filtra os documentos para remover o "placeholder" e mapeia os dados
        const news = snapshot.docs
            .filter(doc => doc.id !== "placeholder")
            .map(doc => ({
                ...doc.data(),
                id: doc.id
            }))
            // Ordena os avisos para que o mais recente venha primeiro
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        return news
    } catch (error) {
        console.error("Erro ao obter avisos:", error)
        throw error
    }
}

// Função para obter todos os avisos de um processo
// export async function getProcessNews(processId) {
//     try {
//         const newsCollectionRef = collection(db, `processes/${processId}/news`)
//         const snapshot = await getDocs(newsCollectionRef)
//         const news = snapshot.docs.map(doc => ({
//             ...doc.data(),
//             id: doc.id
//         }))
//         return news
//     } catch (error) {
//         console.error("Erro ao obter avisos:", error)
//         throw error
//     }
// }

// Função para carregar um aviso específico de um processo seletivo
export async function loadProcessNews(id) {
    const data = await getProcessNews(id)
    return data
}


// Function to get all processes using Mirage.js
// export async function getProcess(id) {
//     const url = id ? `/api/processes/${id}` : "/api/processes"
//     const res = await fetch(url)
//     if (!res.ok) {
//         throw {
//             message: "Failed to fetch processes",
//             statusText: res.statusText,
//             status: res.status
//         }
//     }
//     const data = await res.json()
//     return data.processes
// }