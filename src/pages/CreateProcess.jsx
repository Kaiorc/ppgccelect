import React from "react"
import { styled } from "styled-components"
import { Link } from "react-router-dom"
import Input from "../components/Input"
import TextArea from "../components/TextArea"
import Button from "../components/Button"
import Box from "../components/Box"
import Table from "../components/Table"
import RegistrationFieldModal from "../components/RegistrationFieldModal"
import ImportProcessFieldModal from "../components/ImportProcessFieldModal"
import { createProcess } from "../../services/firebase/firebase-firestore"

const CreateProcessBox = styled(Box)`
    padding: 1em;
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

const CreateProcessFormContainer = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1em;
    padding: 0 1em 1em 1em;
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
`

const ResearchFieldRequiredLabel = styled(BoldLabel)`
    display: flex;
    align-items: center;
    gap: 5px;
`

const ButtonContainer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 1em;
    flex-wrap: wrap;

    @media (max-width: 768px) {
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

export default function CreateProcess() {
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

    const [error, setError] = React.useState(null)

    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = React.useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)
    const [fieldBeingEdited, setFieldBeingEdited] = React.useState(null)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        try {
            await createProcess(processFormData, processFormData.researchFieldRequired)
            console.log("Processo criado com sucesso!")
        } catch (error) {
            console.error("Erro ao criar processo: ", error)
            setError(error)
            alert("Erro ao criar processo: " + error.message)
        }
    }

    console.log(processFormData)

    function handleChange(event) {
        const {name, value, type, checked} = event.target;
        setProcessFormData(prevProcessFormData => ({
            ...prevProcessFormData,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    function handleAddField(field) {
        const isDuplicate = processFormData.registrationFieldsInfo.some(existingField => existingField.name === field.name)
        if (isDuplicate) {
            alert("Um campo com esse nome já existe.")
            return
        }
        setProcessFormData(prevProcessFormData => ({
            ...prevProcessFormData,
            registrationFieldsInfo: [...prevProcessFormData.registrationFieldsInfo, field]
        }))
    }

    function handleImportFields(process) {
        const newFields = process.registrationFieldsInfo.filter(importedField => 
            !processFormData.registrationFieldsInfo.some(existingField => existingField.name === importedField.name)
        )

        if (newFields.length < process.registrationFieldsInfo.length) {
            alert("Alguns campos não foram importados porque já existem.")
        }

        setProcessFormData(prevProcessFormData => ({
            ...prevProcessFormData,
            registrationFieldsInfo: [
                ...prevProcessFormData.registrationFieldsInfo,
                ...newFields
            ]
        }))
        setIsImportModalOpen(false)
    }

    function handleDeleteField(index) {
        setProcessFormData(prevProcessFormData => ({
            ...prevProcessFormData,
            registrationFieldsInfo: prevProcessFormData.registrationFieldsInfo.filter((_, i) => i !== index)
        }));
    }

    function handleEditField(index) {
        setFieldBeingEdited({ ...processFormData.registrationFieldsInfo[index], index });
        setIsEditModalOpen(true);
    }

    function handleSaveEditedField(editedField) {
        setProcessFormData(prevProcessFormData => {
            const updatedFields = [...prevProcessFormData.registrationFieldsInfo];
            updatedFields[editedField.index] = editedField;
            return {
                ...prevProcessFormData,
                registrationFieldsInfo: updatedFields
            };
        });
        setIsEditModalOpen(false);
    }

    return (
        <CreateProcessBox>
            <h1>CRIAR PROCESSO SELETIVO</h1>
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
                            Data de limite da análise de inscrição
                            <Input
                                name="endAnalysisDate"
                                onChange={handleChange}
                                type="date"
                                placeholder="Data de término da análise"
                                value={processFormData.endAnalysisDate}
                                aria-label="Data de término da análise"
                                required
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
                        columnsNames={["Nome", "Tipo", "Obrigatório"]} 
                        data={processFormData.registrationFieldsInfo.map(field => ({
                            Nome: field.name,
                            Tipo: mapFieldType(field.type),
                            Obrigatório: field.required ? "Sim" : "Não"
                        }))}
                        onEditField={handleEditField}
                        onDeleteField={handleDeleteField} 
                    />
                    {error && <ErrorMessage>{error.message}</ErrorMessage>}
                    <ButtonContainer>
                        <Link to="/processes">
                            <Button type="button">
                                CANCELAR
                            </Button>
                        </Link>
                        <Button type="submit">
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
    );
}