// src/pages/Login/styles.js
import styled from "styled-components";

export const LoginPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-image: url("/images/background.png");
  background-size: cover;
  background-position: center;
`;

export const LoginBox = styled.div`
  background-color: rgba(84, 11, 112, 0.95);
  padding: 40px 50px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
  color: #fff1f1;
`;

export const Title = styled.h2`
  text-align: center;
  margin-bottom: 25px;
  font-size: 28px;
`;

export const FeedbackMessage = styled.div`
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 5px;
  background-color: rgba(255, 0, 0, 0.2);
  color: #fff;
  text-align: center;
  p {
    margin: 0;
    font-weight: 500;
  }
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

export const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
  color: #e0c8e6;
`;

export const Input = styled.input`
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #955ca3;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 16px;

  &::placeholder {
    color: #b3a1b8;
  }

  &:focus {
    outline: none;
    border-color: #cc00ff;
    box-shadow: 0 0 5px rgba(204, 0, 255, 0.5);
  }
`;

export const Button = styled.button`
  padding: 12px;
  background-color: #cc00ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #955ca3;
    transform: translateY(-2px);
  }
`;

export const BackLink = styled.a`
  display: block;
  text-align: center;
  margin-top: 20px;
  color: #e0c8e6;
  text-decoration: none;
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
`;
