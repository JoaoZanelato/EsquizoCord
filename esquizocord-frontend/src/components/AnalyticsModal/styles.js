// src/components/AnalyticsModal/styles.js
import styled from "styled-components";

export const AnalyticsLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
`;

export const StatCard = styled.div`
  background-color: ${({ theme }) => theme.backgroundPrimary};
  padding: 16px;
  border-radius: 8px;
  text-align: center;
`;

export const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.headerPrimary};
`;

export const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.textMuted};
  margin-top: 4px;
`;

export const Section = styled.div`
  background-color: ${({ theme }) => theme.backgroundPrimary};
  padding: 16px;
  border-radius: 8px;
`;

export const SectionTitle = styled.h4`
  margin: 0 0 16px 0;
  color: ${({ theme }) => theme.headerPrimary};
`;

export const MemberList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const MemberItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
`;
