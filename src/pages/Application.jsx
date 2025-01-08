import React from "react"
import { useParams, useLocation, Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { styled } from "styled-components"
import { loadProcess, addApplication } from "../../firebase/firebase-firestore"
import { uploadFileToStorage } from "../../appwrite/appwrite-storage"
import useAuth from "../hooks/useAuth"
import { researchAreas } from "../../config"
import Input from "../components/Input"
import Select from "../components/Select"
import Button from "../components/Button"
import Box from "../components/Box"

const ApplicationBox = styled(Box)`
    padding: 1em;
`

const ApplicationFormContainer = styled.form`
    
`

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    /* & input[type=date] { */
    & input, textarea {
        margin-top: 0;
    };
    & input[type="file"] {
        
    }
`

const ButtonContainer = styled.div`

`

const RedSpan = styled.span`
    color: red;
    margin-left: 40px;
`

function validateFile(value) {
    if (!value || !value[0]) return true
    const file = value[0]
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"]
    const maxSize = 2 * 1024 * 1024 // "O arquivo deve ter no máximo 2MB."

    if (!allowedTypes.includes(file.type)) {
        return "Tipo de arquivo não suportado."
    }

    if (file.size > maxSize) {
        return "O arquivo deve ter no máximo 2MB."
    }

    return true
}

export default function Application() {
    const { register, handleSubmit, watch, resetField, formState: { errors } } = useForm()
    const { displayName, uid } = useAuth()

    const [selectionProcess, setSelectionProcess] = React.useState()
    // const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState(null)

    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    React.useEffect(() => {
        async function loadData() {
            const process = await loadProcess(id)
            setSelectionProcess(process)
        }
        loadData()
    }, [id])

    function isResearchAreaSelected() {
        return watch("researchArea") !== ""
    }

    // console.log(isResearchAreaSelected())
    // console.log(selectionProcess)
    // console.log(watch())	
    
    // Função responsável por processar os dados do formulário quando ele é submetido. Ela faz uma
    // cópia dos dados do formulário, verifica se algum campo é um input do tipo file, e se for,
    // substitui a lista de arquivos pelo primeiro arquivo (tratamento necessário para o envio
    // ao serviço de cloud).
    async function onSubmit(data) {
        try {
            // Cria uma cópia dos dados do formulário
            const formData = { ...data }
            // Verifica se o valor é uma lista de arquivos
            for (const key in formData) {
                // Verifica se o valor associado à chave é uma lista de arquivos (FileList)
                if (formData[key] instanceof FileList) {
                    // Pega o primeiro arquivo da lista
                    const file = formData[key][0]
                    if (file) {
                        // Upload no Appwrite Storage e obtém o fileId
                        const fileId = await uploadFileToStorage(file)
                        // Substitui o arquivo pelo fileId
                        formData[key] = fileId
                    }
                }
            }

            // Filtra os dados do formulário para remover valores indefinidos
            const filteredData = Object.fromEntries(
                Object.entries(formData).filter(([_, value]) => value !== undefined)
            )
        
            console.log(filteredData)

            // Envia os dados processados para a função addApplication
            await addApplication(id, filteredData, displayName, uid)
            navigate(`/processes/${id}`)
        } catch (error) {
            console.error("Erro fazer inscrição: ", error)
            setError(error)
            alert("Erro ao fazer inscrição: " + error.message)
        }
    }

    // Array de JSX.Element que contém os campos do formulário de inscrição de um processo.
    // Cada campo é um label que contém um input (com validação), um botão para limpar o campo (caso seja 
    // um input do tipo file), e uma mensagem de erro (caso exista).
    const inputElements = selectionProcess?.registrationFieldsInfo?.map((info) => {
        const isFile = info.type === "file"

        const validationRules = isFile ? {
            required: info.required ? `${info.name} é obrigatório.` : false,
            validate: validateFile
        } : {
            required: info.required ? `${info.name} é obrigatório.` : false
        }

        const fieldValue = watch(info.name)
        const isModified = fieldValue && fieldValue.length > 0

        return (
            <label 
                htmlFor={info.name}
                key={info.name}
            >
                {info.name}
                {info.required && <RedSpan>*Obrigatório</RedSpan>}
                <Input
                    {...register(`${info.name}`, validationRules)}
                    name={info.name}
                    type={info.type}
                    placeholder={info.name}
                    aria-label={info.name}
                    required={info.required}
                />
                {isFile && isModified && (
                    <button type="button" onClick={() => resetField(info.name)}>
                        Limpar
                    </button>
                )}
                {errors[info.name] && <RedSpan>{errors[info.name].message}</RedSpan>}
            </label>
        )
    })

    return (
        <ApplicationBox>
            <h1>INSCRIÇÃO</h1>
            <ApplicationFormContainer onSubmit={handleSubmit(onSubmit)}>
                <h2>DADOS DO CANDIDATO</h2>
                    <InputContainer>
                        <label htmlFor="researchArea">
                            Linha de Pesquisa
                            <Select
                                optionPlaceholder="Selecione a linha de pesquisa desejada"
                                optionsArray={researchAreas}
                                {...register("researchArea", { required: "Linha de pesquisa é obrigatória." })}
                                name="researchArea"
                                required
                            />
                        </label>
                        { isResearchAreaSelected() && inputElements }
                    </InputContainer>
                    { isResearchAreaSelected() && (
                        <ButtonContainer>
                            <Link to="/processes">
                                <Button type="button">
                                    CANCELAR
                                </Button>
                            </Link>
                            <Button type="submit">
                                ENVIAR
                            </Button>
                        </ButtonContainer>
                        )
                    }
            </ApplicationFormContainer>
        </ApplicationBox>
    )
}