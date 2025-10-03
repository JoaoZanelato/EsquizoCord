// src/components/AnalyticsModal/AnalyticsModal.jsx
import React, { useState, useEffect } from "react";
import apiClient from "../../services/api";
import {
  ModalOverlay,
  ModalContent,
  CloseButton,
  Title,
} from "../../pages/Settings/styles";
import {
  AnalyticsLayout,
  StatsGrid,
  StatCard,
  StatValue,
  StatLabel,
  Section,
  SectionTitle,
  MemberList,
  MemberItem,
} from "./styles";

import { Bar } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from "chart.js";
Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

const AnalyticsModal = ({ isOpen, onClose, groupDetails }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && groupDetails) {
      setLoading(true);
      apiClient
        .get(`/groups/${groupDetails.id_grupo}/analytics`)
        .then((response) => {
          setAnalytics(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Erro ao buscar relatório:", error);
          setLoading(false);
        });
    }
  }, [isOpen, groupDetails]);

  const chartData = {
    labels:
      analytics?.dailyActivity.map((d) =>
        new Date(d.date).toLocaleDateString("pt-BR")
      ) || [],
    datasets: [
      {
        label: "Mensagens por Dia",
        data: analytics?.dailyActivity.map((d) => d.count) || [],
        backgroundColor: "rgba(88, 101, 242, 0.8)",
        borderColor: "rgba(88, 101, 242, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px" }}
      >
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <Title as="h3">Relatório do Servidor</Title>

        {loading ? (
          <p>A carregar dados...</p>
        ) : !analytics ? (
          <p>Não foi possível carregar os dados.</p>
        ) : (
          <AnalyticsLayout>
            <StatsGrid>
              <StatCard>
                <StatValue>{analytics.general.memberCount}</StatValue>
                <StatLabel>Membros</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{analytics.general.totalMessages}</StatValue>
                <StatLabel>Total de Mensagens</StatLabel>
              </StatCard>
            </StatsGrid>

            <Section>
              <SectionTitle>Atividade nos Últimos 7 Dias</SectionTitle>
              <Bar data={chartData} />
            </Section>

            <Section>
              <SectionTitle>Membros Mais Ativos</SectionTitle>
              <MemberList>
                {analytics.topMembers.map((member, index) => (
                  <MemberItem key={index}>
                    <span>
                      {index + 1}. {member.nome}
                    </span>
                    <strong>{member.messageCount} mensagens</strong>
                  </MemberItem>
                ))}
              </MemberList>
            </Section>
          </AnalyticsLayout>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};

export default AnalyticsModal;
