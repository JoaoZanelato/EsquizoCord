// src/context/NotificationContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import styled, { keyframes } from "styled-components";

const NotificationContext = createContext();

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NotificationToast = styled.div`
  min-width: 250px;
  padding: 15px;
  border-radius: 8px;
  color: #fff;
  background-color: ${({ type, theme }) =>
    type === "success" ? theme.greenAccent : theme.redDanger};

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: ${fadeIn} 0.3s ease-out, ${fadeOut} 0.3s ease-in 2.7s forwards;
  font-weight: 500;
`;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "error") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <NotificationContainer>
        {notifications.map((n) => (
          <NotificationToast key={n.id} type={n.type}>
            {n.message}
          </NotificationToast>
        ))}
      </NotificationContainer>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  return useContext(NotificationContext);
};
