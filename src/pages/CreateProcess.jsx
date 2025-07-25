import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { createProcess } from "../../services/firebase/firebase-firestore"
import { validateProcessForm, sanitizeInput } from "../utils/validators/processFormsValidators"
import { styled } from "styled-components"
import Input from "../components/Input"
import TextArea from "../components/TextArea"
import Button from "../components/Button"
import Box from "../components/Box"
import Table from "../components/Table"
import RegistrationFieldModal from "../components/RegistrationFieldModal"
import ImportProcessFieldModal from "../components/ImportProcessFieldModal"
import AlertBox from "../components/AlertBox"

const CreateProcessBox = styled(Box)`
    min-width: 300px; // Adicionando min-width
    
    @media (max-width: 1024px) {
        max-width: 900px;
    }

    @media (max-width: 768px) {
        max-width: 100%;
    }

    @media (max-width: 480px) {
        max-width: 100%;
        
    }

    @media (max-width: 345px) {
        padding: 0.25em;
        margin: 1em 0.5em; // Ajustando a margem para telas menores
    }
`

const TitleContainer = styled.div`
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin: 0 0 1em 0;
    border-radius: 8px 8px 0 0;
    background-color: #008442;

    & h1 {
        text-transform: uppercase;
        text-align: center;
    }
`

const CreateProcessFormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1em;
    padding: 0 1em 1em 1em;
    & h2 {
        margin: 0;
    }
`

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1em;

    & input, textarea {
        margin-top: 0;
    }
`

const BoldLabel = styled.label`
    font-weight: bold;
    & p {
        margin: 0;
        font-weight: normal;
        font-size: 1em;
        color: #008442;
    }
`

const ResearchFieldRequiredLabel = styled(BoldLabel)`
    display: flex;
    align-items: center;
    gap: 5px;
`

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-evenly;
    gap: 1em;
    flex-wrap: wrap;

    @media (max-width: 425px) {
        flex-direction: column;
        align-items: center;
    }
`

const TableHeaderContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
    }
`

const RedButton = styled(Button)`
  background-color: red;
  color: white;

  &:hover {
    background-color: darkred;
  }
`

const ErrorMessage = styled.p`
    color: red;
    text-align: center;
    font-weight: bold;
    font-size: 1.2em;
`

function mapFieldType(type) {
    switch(type) {
        case 'text':
            return 'Texto';
        case 'number':
            return 'Número';
        case 'date':
            return 'Data';
        case 'email':
            return 'Email';
        case 'file':
            return 'Arquivo';
        default:
            return type;
    }
}

// Componente principal da página de criação de processo seletivo
export default function CreateProcess() {
    // Estado para armazenar os dados do formulário do processo seletivo
    const [processFormData, setProcessFormData] = React.useState({
        name: "", 
        places: "",
        miniDescription: "", 
        description: "",
        researchFieldRequired: false,
        startDate: "",
        endDate: "",
        endAnalysisDate: "", 
        registrationFieldsInfo: []
    })

    // Estados para controlar o carregamento do envio do formulário e erros
    const [submitLoading, setSubmitLoading] = React.useState(false)
    const [error, setError] = React.useState(null)

    // Estados para controlar a abertura dos modais de registro e importação de campos
    // e para edição de campos
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = React.useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
    const [fieldBeingEdited, setFieldBeingEdited] = React.useState(null)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

    // Hook do React Router para navegação
    const navigate = useNavigate()

    // Calcula a data de hoje para validação
    const today = new Date().toISOString().split('T')[0]

    // Calcula o valor mínimo para a data de término com base na data de início
    let minEndDate = processFormData.startDate ? new Date(processFormData.startDate) : null
    if(minEndDate) {
        minEndDate.setDate(minEndDate.getDate() + 1)
        minEndDate = minEndDate.toISOString().split('T')[0]
    }

    // useEffect para atualizar a data limite de análise quando a data de término é alterada e
    // define a data limite de análise como 10 dias após o término das inscrições
    React.useEffect(() => {
        if (processFormData.endDate) {
            const endDate = new Date(processFormData.endDate)
            // Define a data limite de análise como 10 dias após o término das inscrições
            endDate.setDate(endDate.getDate() + 10)
            setProcessFormData(prev => ({
                ...prev,
                endAnalysisDate: endDate.toISOString().split('T')[0]
            }))
        }
    }, [processFormData.endDate])

    // Função para lidar com o envio do formulário
    async function handleSubmit(event) {
        // Previne o comportamento padrão do formulário
        event.preventDefault()

        // Valida os dados do formulário
        const validationError = validateProcessForm(processFormData, today)
        // Se houver um erro de validação, define o erro no estado e retorna
        if (validationError) {
            setError({message: validationError})
            return
        }

        // Sanitiza os campos de texto usando a função importada
        const sanitizedData = {
            ...processFormData,
            name: sanitizeInput(processFormData.name),
            miniDescription: sanitizeInput(processFormData.miniDescription),
            description: sanitizeInput(processFormData.description),
        }

        // Tenta criar o processo seletivo com os dados sanitizados
        try {
            setSubmitLoading(true)
            await createProcess(sanitizedData, sanitizedData.researchFieldRequired)
            console.log("Processo criado com sucesso!")
            navigate("/processes")
        } catch (error) {
            console.error("Erro ao criar processo: ", error)
            setError(error)
            alert("Erro ao criar processo: " + error.message)
        } finally {
            setSubmitLoading(false)
        }
    }

    // console.log(processFormData)

    // function handleChange(event) {
    //     const {name, value, type, checked} = event.target;
    //     if (name === "endDate" && new Date(value) <= new Date(processFormData.startDate)) {
    //         alert("A data de término deve ser após a data de início")
    //         return
    //     }
    //     setProcessFormData(prevProcessFormData => ({
    //         ...prevProcessFormData,
    //         [name]: type === 'checkbox' ? checked : value
    //     }))
    // }

    // Função para lidar com as mudanças nos campos do formulário
    function handleChange(event) {
        // Extrai o nome, valor, tipo e estado do campo do evento
        const {name, value, type, checked} = event.target

        // A data de término deve ser posterior à data de início
        if (name === "endDate" && processFormData.startDate && new Date(value) <= new Date(processFormData.startDate)) {
            alert("A data de término deve ser posterior à data de início")
            return
        }

        // A data de início deve ser anterior à data de término
        if (name === "startDate" && processFormData.endDate && new Date(value) >= new Date(processFormData.endDate)) {
            alert("A data de início deve ser anterior à data de término")
            return
        }

        // Atualiza o estado do formulário com o novo valor
        setProcessFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    // Função para adicionar um novo campo ao formulário
    function handleAddField(field) {
        // Verifica se o campo já existe no formulário para evitar duplicatas
        const isDuplicate = processFormData.registrationFieldsInfo.some(existingField => existingField.name === field.name)
        // Se o campo já existir, exibe um alerta e não adiciona o campo
        if (isDuplicate) {
            alert("Um campo com esse nome já existe.")
            return
        }
        // Se o campo não existir, adiciona-o ao estado do formulário
        setProcessFormData(prevProcessFormData => ({
            ...prevProcessFormData,
            registrationFieldsInfo: [...prevProcessFormData.registrationFieldsInfo, field]
        }))
    }

    // Função para importar campos de outro processo
    function handleImportFields(process) {
        // Verifica se o processo tem campos de registro repetidos
        const newFields = process.registrationFieldsInfo.filter(importedField => 
            !processFormData.registrationFieldsInfo.some(existingField => existingField.name === importedField.name)
        )

        // Se houver campos repetidos, exibe um alerta avisando que alguns campos não foram importados
        if (newFields.length < process.registrationFieldsInfo.length) {
            alert("Alguns campos não foram importados porque já existem.")
        }

        // Atualiza o estado do formulário com os novos campos importados
        setProcessFormData(prevProcessFormData => ({
            ...prevProcessFormData,
            registrationFieldsInfo: [
                ...prevProcessFormData.registrationFieldsInfo,
                ...newFields
            ]
        }))
        setIsImportModalOpen(false)
    }

    // Função para lidar com a exclusão de um campo do formulário
    function handleDeleteField(index) {
        // Atualiza o estado do formulário removendo o campo no índice especificado
        setProcessFormData(prevProcessFormData => ({
            ...prevProcessFormData,
            registrationFieldsInfo: prevProcessFormData.registrationFieldsInfo.filter((_, i) => i !== index)
        }))
    }

    // Função para lidar com a edição de um campo do formulário
    function handleEditField(index) {
        // Define o campo a ser editado e abre o modal de edição
        setFieldBeingEdited({ ...processFormData.registrationFieldsInfo[index], index })
        setIsEditModalOpen(true)
    }

    // Função para lidar com o salvamento do campo editado
    function handleSaveEditedField(editedField) {
        // Atualiza o campo editado no estado do formulário
        setProcessFormData(prevProcessFormData => {
            const updatedFields = [...prevProcessFormData.registrationFieldsInfo]
            updatedFields[editedField.index] = editedField
            return {
                ...prevProcessFormData,
                registrationFieldsInfo: updatedFields
            }
        })
        setIsEditModalOpen(false)
    }

    return (
        <CreateProcessBox>
            <TitleContainer>
                <h1>CRIAR PROCESSO SELETIVO</h1>
            </TitleContainer>
            <CreateProcessFormContainer onSubmit={handleSubmit}>
                <h2>DADOS MÍNIMOS OBRIGATÓRIOS</h2>
                    <InputContainer>
                        <BoldLabel htmlFor="name">
                            Nome
                            <Input
                                name="name"
                                onChange={handleChange}
                                type="text"
                                placeholder="Nome"
                                value={processFormData.name}
                                aria-label="Nome"
                                required
                            />
                        </BoldLabel>
                        <BoldLabel htmlFor="places">
                            Número de vagas
                            <Input
                                name="places"
                                onChange={handleChange}
                                type="number"
                                min= "1"
                                placeholder="Número de vagas"
                                value={processFormData.places}
                                aria-label="Número de Vagas"
                                required
                            />
                        </BoldLabel>
                        <BoldLabel htmlFor="miniDescription">
                            Mini descrição
                            <Input
                                name="miniDescription"
                                onChange={handleChange}
                                type="text"
                                placeholder="Mini descrição"
                                value={processFormData.miniDescription}
                                aria-label="Mini Descrição"
                                maxLength="60"
                                required
                            />
                        </BoldLabel>
                        <BoldLabel htmlFor="description">
                            Descrição
                            <TextArea
                                name="description"
                                onChange={handleChange}
                                type="text"
                                placeholder="Descrição"
                                value={processFormData.description}
                                aria-label="Descrição"
                                required
                            />
                        </BoldLabel>
                        <ResearchFieldRequiredLabel htmlFor="researchFieldRequired">
                            <Input
                                name="researchFieldRequired"
                                onChange={handleChange}
                                type="checkbox"
                                checked={processFormData.researchFieldRequired}
                                aria-label="Linha de pesquisa obrigatória"
                            />
                            Seleção de linha de pesquisa é obrigatória?
                        </ResearchFieldRequiredLabel>
                        <BoldLabel htmlFor="startDate">
                            Data de início de inscrição
                            <Input
                                name="startDate"
                                onChange={handleChange}
                                type="date"
                                placeholder="Data de início"
                                value={processFormData.startDate}
                                aria-label="Data de início"
                                required
                            />
                        </BoldLabel>
                        <BoldLabel htmlFor="endDate">
                            Data de término de inscrição
                            <Input
                                name="endDate"
                                onChange={handleChange}
                                type="date"
                                placeholder="Data de término"
                                value={processFormData.endDate}
                                aria-label="Data de término"
                                required
                            />    
                        </BoldLabel>
                        <BoldLabel htmlFor="endAnalysisDate">
                            Data limite da análise de inscrição
                            <p>Essa data é automaticamente 10 dias após a data de término de inscrição</p>
                            <Input
                                name="endAnalysisDate"
                                onChange={handleChange}
                                type="date"
                                placeholder="Data limite da análise de inscrição"
                                value={processFormData.endAnalysisDate}
                                aria-label="Data limite da análise de inscrição"
                                required
                                disabled
                            />
                        </BoldLabel>
                    </InputContainer>
                    <TableHeaderContainer>
                        <h2>DADOS SOLICITADOS AO CANDIDATO</h2>
                        <ButtonContainer>
                            <Button
                                type="button" 
                                onClick={() => setIsImportModalOpen(true)}
                            >
                                IMPORTAR
                            </Button>
                            <Button 
                                type="button" 
                                onClick={() => setIsRegistrationModalOpen(true)}
                            >
                                + CAMPO
                            </Button>
                        </ButtonContainer>
                    </TableHeaderContainer>
                    <Table 
                        columnsNames={["NOME", "TIPO", "OBRIGATÓRIO"]} 
                        data={processFormData.registrationFieldsInfo.map(field => ({
                            NOME: field.name,
                            TIPO: mapFieldType(field.type),
                            OBRIGATÓRIO: field.required ? "Sim" : "Não"
                        }))}
                        onEditField={handleEditField}
                        onDeleteField={handleDeleteField}
                    />
                    {error && <ErrorMessage>{error.message}</ErrorMessage>}
                    {error && <AlertBox message={error.message} onClose={() => setError(null)} />}
                    <ButtonContainer>
                        <Link to="/processes">
                            <Button type="button">
                                CANCELAR
                            </Button>
                        </Link>
                        <Button type="submit" loading={submitLoading}>
                            CRIAR
                        </Button>
                    </ButtonContainer>
                {
                    isRegistrationModalOpen && (
                        <RegistrationFieldModal 
                            onClose={() => setIsRegistrationModalOpen(false)} 
                            onSave={handleAddField} 
                        />
                    )
                }
                {
                    isImportModalOpen && (
                        <ImportProcessFieldModal 
                            onClose={() => setIsImportModalOpen(false)} 
                            onImport={handleImportFields} 
                        />
                    )
                }
                {
                    isEditModalOpen && (
                        <RegistrationFieldModal 
                            onClose={() => setIsEditModalOpen(false)} 
                            onSave={handleSaveEditedField} 
                            fieldToEdit={fieldBeingEdited}
                        />
                    )
                }
            </CreateProcessFormContainer>
        </CreateProcessBox>
    )
}