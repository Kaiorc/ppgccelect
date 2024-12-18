import { styled } from "styled-components";

const StyledTextArea = styled.textarea`
    background-color: #f5f5f5;
    resize: none;
    width: 100%;
    height: 30vh;
    margin: 10px 0;
    padding: 1.2em;
    border: 2px solid #008442;
    border-radius: 5px;
    outline: none;
    font-family: 'Roboto', sans-serif;
    font-size: 1rem;
    &:focus {
        border: 2px solid #F0852E;
    }
`

export default function TextArea({ name, onChange, type, placeholder, value }) {
    
    return (
        <StyledTextArea
            name={name}
            onChange={onChange}
            type={type}
            placeholder={placeholder}
            value={value}
        />
    )
}