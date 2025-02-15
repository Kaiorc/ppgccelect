import React from "react";
import PpgccLogo from "../assets/images/logo-ppgcc.png";
import UeceLogo from "../assets/images/logo-uece.png";
import { styled } from "styled-components";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import useAuth from "../hooks/useAuth";
import { authLogOut } from "../../services/firebase/firebase-authentication"

const HeaderContainer = styled.header`
    background-color: #008442;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    padding: 10px;

    @media (max-width: 1024px) {
        flex-direction: column;
        align-items: center;
    }
`

const InfoContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0px;
`    
    
const InfoAreaContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin: 0.6em 10px 10px 0;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;
        margin: 0;
    }
`    

const InfoMessage = styled.b`
    color: #fff;
    margin: 0;
    text-align: center;
    font-size: 1rem;

    @media (max-width: 480px) {
        font-size: 0.9rem;
    }
`    

const UeceLogoImg = styled.img`
    width: 22vw;
    max-width: 490px;
    min-width: 180px;
    height: auto;
    margin: 10px;
    object-fit: contain;

    @media (max-width: 1024px) {
        width: 35vw;
    }

    @media (max-width: 768px) {
        width: 55vw;
    }

    @media (max-width: 480px) {
        width: 65vw;
    }
`

const PpgccLogoImg = styled.img`
    width: 28vw;
    max-width: 576px;
    min-width: 200px;
    height: auto;
    margin: 10px;
    object-fit: contain;

    @media (max-width: 1024px) {
        width: 35vw;
    }

    @media (max-width: 768px) {
        width: 60vw;
    }

    @media (max-width: 480px) {
        width: 70vw;
    }
`

const NavigationButtonsContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 1em;
    margin: 0.6em 0;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;
        margin: 0;
    }
`

export default function Header() {

    let location = useLocation();

    const navigate = useNavigate()

    const { isLoggedIn, setIsLoggedIn, displayName } = useAuth()

    async function handleLogOutButtonClick() {
        try {
            await authLogOut(setIsLoggedIn)
            navigate("/", { replace: true })
        } catch(error) {
            console.error(error.message)
            throw error
        }
    }
    
    return(
        <HeaderContainer>
            <InfoContainer>
                <Link to="/processes">
                    <UeceLogoImg 
                        src={UeceLogo} 
                        alt='logo' 
                        className="logo-img"
                        />
                </Link>
                {location.pathname !== "/" && location.pathname !== "/processes" && location.pathname !== "/signin" && (
                    <NavigationButtonsContainer>
                        <Button 
                            type="button" 
                            onClick={() => navigate(-1)}
                        >
                            ← VOLTAR
                        </Button>
                        <Button 
                            type="button" 
                            onClick={() => navigate("/")}
                        >
                            ⌂ INÍCIO
                        </Button>
                    </NavigationButtonsContainer>
                )}
            </InfoContainer>
            <InfoContainer>
                <PpgccLogoImg 
                    src={PpgccLogo} 
                    alt='logo' 
                    className="logo-img"
                />
                { isLoggedIn && location.pathname !== "/" && location.pathname !== "/signin" && (
                    <InfoAreaContainer>
                        <InfoMessage>BEM VINDO(A), {displayName ? displayName.toUpperCase() : "CANDIDATO(A)"}</InfoMessage>
                        <Button 
                            type="button"
                            onClick={handleLogOutButtonClick}	
                        >
                            SAIR
                        </Button>
                    </InfoAreaContainer>
                )}
            </InfoContainer>
        </HeaderContainer>
    )
}